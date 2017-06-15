import { Observable } from 'rxjs/Observable';
import { sortBy, keyBy, assign } from 'lodash';

import { Models as P } from 'lik-shared';

import { listUserDatabases, getDatabaseAsObservable, getAllDocumentsForPrefixFromDb, dbNames, getAllDocumentsFromDb, getDocumentByKeyFromDb, getUserDatabaseName } from '../effects/pouchdb-utils';

export function loadAllPreismeldestellen() {
    return getAllDocumentsForPrefixFromUserDbs<P.Preismeldestelle>('pms/')
        .flatMap(preismeldestellen => getDatabaseAsObservable(dbNames.preismeldestelle)
            .flatMap(db => getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(db, 'pms/'))
            .map(unassignedPms => {
                const remainingPms = unassignedPms.filter(pms => !preismeldestellen.some(x => x.pmsNummer === pms.pmsNummer));
                return sortBy([...preismeldestellen, ...remainingPms], pms => pms.pmsNummer)
            })
        );
}

export function loadAllPreismeldungen(pmsNummer: string = '') {
    return getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>(`pm/${pmsNummer}`)
        .flatMap(preismeldungen => getDatabaseAsObservable(dbNames.preismeldung)
            .flatMap(db => getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(db, `pm-ref/${pmsNummer}`).then(pmRefs => keyBy(pmRefs, pmRef => getPreismeldungId(pmRef))))
            .map(pmRefs => preismeldungen.map(pm => assign({}, pm, { pmRef: pmRefs[getPreismeldungId(pm)] }) as P.Preismeldung & { pmRef: P.PreismeldungReference }))
        );
}

export function loadAllPreiserheber() {
    return getAllDocumentsForPrefixFromUserDbs<P.Erheber>('preiserheber')
        .flatMap(preiserheber => getDatabaseAsObservable(dbNames.preiserheber)
            .flatMap(db => getAllDocumentsFromDb<P.Erheber>(db))
            .map(unassignedPe => {
                const remainingPe = unassignedPe.filter(pe => !preiserheber.some(x => x.username === pe.username));
                return sortBy([...preiserheber.map(pe => assign({}, pe, { _id: pe.username })), ...remainingPe], pe => pe.username)
            })
        );
}

export function loadPreiserheber(id: string) {
    return listUserDatabases()
        .flatMap(userDbNames => {
            const userDbName = userDbNames.find(dbName => dbName === getUserDatabaseName(id));
            if (userDbName) {
                return getDatabaseAsObservable(userDbName)
                    .flatMap(db => getDocumentByKeyFromDb<P.Erheber>(db, 'preiserheber').then(pe => assign(pe, { _id: pe.username })))
            }
            return getDatabaseAsObservable(dbNames.preiserheber)
                .flatMap(db => getDocumentByKeyFromDb<P.Erheber>(db, id))
        });
}

export function updatePreiserheber(preiserheber: P.Erheber) {
    return listUserDatabases()
        .flatMap(userDbNames => {
            const userDbName = userDbNames.find(dbName => dbName === getUserDatabaseName(preiserheber.username));
            if (userDbName) {
                return getDatabaseAsObservable(userDbName).map(db => ({ db, updatedPreiserheber: assign({}, preiserheber, { _id: 'preiserheber', _rev: undefined }) }))
            }
            return getDatabaseAsObservable(dbNames.preiserheber).map(db => ({ db, updatedPreiserheber: preiserheber }))
        })
        .flatMap(({ db, updatedPreiserheber }) => db.post(updatedPreiserheber));
}

function getAllDocumentsForPrefixFromUserDbs<T extends P.CouchProperties>(prefix: string) {
    return listUserDatabases()
        .flatMap(dbnames => Observable.from(dbnames)
            .flatMap(dbname => getDatabaseAsObservable(dbname))
            .flatMap(db => getAllDocumentsForPrefixFromDb<T>(db, prefix))
            .reduce((acc, docs) => [...acc, ...docs], [])
        );
}

function getPreismeldungId(doc: { pmsNummer: string, epNummer: string, laufnummer: string  }) {
    return `${doc.pmsNummer}/${doc.epNummer}/${doc.laufnummer}`;
}
