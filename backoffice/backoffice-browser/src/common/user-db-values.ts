import { Observable } from 'rxjs/Observable';
import { sortBy, keyBy, assign } from 'lodash';

import { Models as P } from 'lik-shared';

import { listUserDatabases, getDatabaseAsObservable, getAllDocumentsForPrefixFromDb, dbNames } from '../effects/pouchdb-utils';

export function loadAllPreismeldestellen() {
    return getAllDocumentsForPrefixFromUserDbs<P.Preismeldestelle>('pms/')
        .flatMap(preismeldestellen => getDatabaseAsObservable(dbNames.preismeldestelle)
            .flatMap(db => getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(db, 'pms/'))
            .map(unassignedPms => sortBy([...preismeldestellen, ...unassignedPms.filter(pms => !preismeldestellen.some(x => x.pmsNummer === pms.pmsNummer))], pms => pms.pmsNummer))
        );
}

export function loadAllPreismeldungen() {
    return getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>('pm/')
        .flatMap(preismeldungen => getDatabaseAsObservable(dbNames.preismeldung)
            .flatMap(db => getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(db, 'pm-ref/').then(pmRefs => keyBy(pmRefs, pmRef => getPreismeldungId(pmRef))))
            .map(pmRefs => preismeldungen.map(pm => assign({}, pm, { pmRef: pmRefs[getPreismeldungId(pm)] }) as P.Preismeldung & { pmRef: P.PreismeldungReference }))
        );
}

function getAllDocumentsForPrefixFromUserDbs<T>(prefix: string) {
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