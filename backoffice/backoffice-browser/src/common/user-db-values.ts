import { Observable } from 'rxjs/Observable';
import { sortBy, keyBy, assign } from 'lodash';

import { Models as P, preismeldungId, preismeldungRefId, preismeldestelleId, pmsSortId } from 'lik-shared';

import {
    listUserDatabases,
    getDatabaseAsObservable,
    getAllDocumentsForPrefixFromDb,
    dbNames,
    getAllDocumentsFromDb,
    getDocumentByKeyFromDb,
    getUserDatabaseName,
} from '../effects/pouchdb-utils';

export function loadAllPreismeldestellen() {
    return getAllDocumentsForPrefixFromUserDbs<P.Preismeldestelle>(preismeldestelleId()).flatMap(
        (preismeldestellen: any[]) =>
            getDatabaseAsObservable(dbNames.preismeldestelle)
                .flatMap(db => getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(db, preismeldestelleId()))
                .map(unassignedPms => {
                    const remainingPms = unassignedPms.filter(
                        pms => !preismeldestellen.some(x => x.pmsNummer === pms.pmsNummer)
                    );
                    return sortBy([...preismeldestellen, ...remainingPms], pms => pms.pmsNummer);
                })
    );
}

export function loadAllPreismeldungenForExport(
    pmsNummer: string = ''
): Observable<(P.Preismeldung & P.PreismeldungSortProperties)[]> {
    return getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>(preismeldungId(pmsNummer)).map(preismeldungen => {
        let sortierungsnummer: number;
        let lastPmsNummer: string = null;
        return sortBy(preismeldungen.filter(pm => pm.istAbgebucht), [pm => pm.pmsNummer, pm => pm.erfasstAt]).map(
            pm => {
                if (lastPmsNummer !== pm.pmsNummer) {
                    sortierungsnummer = 0;
                    lastPmsNummer = pm.pmsNummer;
                }
                sortierungsnummer++;
                if (!!pm.erfasstAt) {
                    return { ...pm, sortierungsnummer };
                }
                return pm;
            }
        );
    });
}

export function loadPreismeldungenAndRefPreismeldungForPms(pmsNummer: string) {
    return getDatabaseAsObservable(dbNames.preiszuweisung)
        .flatMap(db => getAllDocumentsFromDb<P.Preiszuweisung>(db))
        .flatMap(preiszuweisungen => {
            const preiszuweisung = preiszuweisungen.find(x => x.preismeldestellenNummern.some(n => n === pmsNummer));
            if (!!preiszuweisung) {
                return getDatabaseAsObservable(`user_${preiszuweisung.preiserheberId}`)
                    .flatMap(db =>
                        getAllDocumentsForPrefixFromDb<P.Preismeldung>(db, preismeldungId(pmsNummer)).then(
                            preismeldungen => ({
                                db,
                                preismeldungen,
                            })
                        )
                    )
                    .flatMap(({ db, preismeldungen }) =>
                        db
                            .get(preismeldestelleId(pmsNummer))
                            .then((pms: P.Preismeldestelle) => ({ preismeldungen, pms }))
                    )
                    .flatMap(({ preismeldungen, pms }) =>
                        getDatabaseAsObservable(dbNames.preismeldung).map(db => ({ db, preismeldungen, pms }))
                    )
                    .flatMap(({ db, preismeldungen, pms }) =>
                        getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(db, preismeldungRefId(pmsNummer)).then(
                            refPreismeldungen => ({ refPreismeldungen, preismeldungen, pms })
                        )
                    );
            }
            return Observable.of({ refPreismeldungen: [], preismeldungen: [], pms: null });
        });
}

export function loadAllPreiserheber() {
    return getAllDocumentsForPrefixFromUserDbs<P.Erheber>('preiserheber').flatMap((preiserheber: P.Erheber[]) =>
        getDatabaseAsObservable(dbNames.preiserheber)
            .flatMap(db => getAllDocumentsFromDb<P.Erheber>(db))
            .map(unassignedPe => {
                const remainingPe = unassignedPe.filter(pe => !preiserheber.some(x => x.username === pe.username));
                return sortBy(
                    [...preiserheber.map(pe => assign({}, pe, { _id: pe.username })), ...remainingPe],
                    pe => pe.username
                );
            })
    );
}

export function loadPreiserheber(id: string) {
    return listUserDatabases().flatMap(userDbNames => {
        const userDbName = userDbNames.find(dbName => dbName === getUserDatabaseName(id));
        if (userDbName) {
            return getDatabaseAsObservable(userDbName).flatMap(db =>
                getDocumentByKeyFromDb<P.Erheber>(db, 'preiserheber').then(pe => assign(pe, { _id: pe.username }))
            );
        }
        return getDatabaseAsObservable(dbNames.preiserheber).flatMap(db => getDocumentByKeyFromDb<P.Erheber>(db, id));
    });
}

export function updatePreiserheber(preiserheber: P.Erheber) {
    return listUserDatabases()
        .flatMap(userDbNames => {
            const userDbName = userDbNames.find(dbName => dbName === getUserDatabaseName(preiserheber.username));
            if (userDbName) {
                return getDatabaseAsObservable(userDbName).map(db => ({
                    db,
                    updatedPreiserheber: assign({}, preiserheber, { _id: 'preiserheber' }),
                }));
            }
            return getDatabaseAsObservable(dbNames.preiserheber).map(db => ({ db, updatedPreiserheber: preiserheber }));
        })
        .flatMap(({ db, updatedPreiserheber }) => db.put(updatedPreiserheber));
}

export function getAllDocumentsForPrefixFromUserDbs<T extends P.CouchProperties>(prefix: string): Observable<T[]> {
    return listUserDatabases().flatMap(dbnames =>
        Observable.from(dbnames)
            .flatMap(dbname => getDatabaseAsObservable(dbname))
            .flatMap(db => getAllDocumentsForPrefixFromDb<T>(db, prefix))
            .reduce((acc, docs) => [...acc, ...docs], [])
    );
}
