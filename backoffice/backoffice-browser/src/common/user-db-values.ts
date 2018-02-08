import { Observable } from 'rxjs/Observable';
import { sortBy, keyBy, assign, flatten } from 'lodash';

import { Models as P, preismeldungId, preismeldungRefId, preismeldestelleId, pmsSortId } from 'lik-shared';

import {
    listUserDatabases,
    getDatabaseAsObservable,
    getAllDocumentsForPrefixFromDb,
    dbNames,
    getAllDocumentsFromDb,
    getDocumentByKeyFromDb,
    getUserDatabaseName,
    getDatabase,
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

export function loadAllPreismeldungenForExport(pmsNummer: string = '') {
    return getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>(preismeldungId(pmsNummer))
        .flatMap(preismeldungen =>
            getAllDocumentsForPrefixFromUserDbs<P.PmsPreismeldungenSort>(pmsSortId(pmsNummer)).map(
                preismeldungenSorts => ({
                    preismeldungenSorts,
                    preismeldungen,
                })
            )
        )
        .map(({ preismeldungenSorts, preismeldungen }) => {
            const preismeldungenSortsKeyed = keyBy(preismeldungenSorts, preismeldungenSort =>
                preismeldungenSort._id.substr(9)
            );
            return preismeldungen.map(pm => ({
                pm,
                sortOrder: (() => {
                    const sortOrder = preismeldungenSortsKeyed[pm.pmsNummer].sortOrder.find(x => x.pmId === pm._id);
                    return !!sortOrder ? sortOrder.sortierungsnummer : Number.MAX_SAFE_INTEGER;
                })(),
            }));
        });
}

export async function loadPreismeldungenAndRefPreismeldungForPms(pmsNummer: string) {
    const preiszuweisungen = await getDatabase(dbNames.preiszuweisung).then(db =>
        getAllDocumentsFromDb<P.Preiszuweisung>(db)
    );
    const preiszuweisung = preiszuweisungen.find(x => x.preismeldestellenNummern.some(n => n === pmsNummer));
    if (!preiszuweisung) {
        return { refPreismeldungen: [], preismeldungen: [], pms: null };
    }

    const userDb = await getDatabase(`user_${preiszuweisung.preiserheberId}`);
    const preismeldungen = await getAllDocumentsForPrefixFromDb<P.Preismeldung>(userDb, preismeldungId(pmsNummer));
    const pms = await userDb.get(preismeldestelleId(pmsNummer));
    const refPreismeldungen = await getDatabase(dbNames.preismeldung).then(db =>
        getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(db, preismeldungRefId(pmsNummer))
    );
    const alreadyExported = await getDatabase(dbNames.exports).then(db =>
        getAllDocumentsFromDb<any>(db).then(docs => flatten(docs.map(doc => (doc.preismeldungIds as string[]) || [])))
    );

    return { refPreismeldungen, preismeldungen, pms, alreadyExported };
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
