import { Observable } from 'rxjs';
import { assign, isEqual } from 'lodash';

import { listUserDatabases, getDatabaseAsObservable, dbNames, getAllDocumentsFromDb } from '../effects/pouchdb-utils';
import { Models as P, allPropertiesExeceptIdAndRev } from 'lik-shared';

export function copyUserDbErheberDetailsToPreiserheberDb() {
    return listUserDatabases()
        .flatMap(dbs => Observable.forkJoin(dbs.map(dbName => getDatabaseAsObservable(dbName).flatMap(db => db.get<P.Erheber>('preiserheber')))))
        .flatMap(userPreiserhebers => getDatabaseAsObservable(dbNames.preiserheber).flatMap(db => getAllDocumentsFromDb<P.Erheber>(db)).map(erhebers => ({ erhebers, userPreiserhebers })))
        .map(({ erhebers, userPreiserhebers }) =>
            erhebers
                .map(erheber => {
                    const userPreiserheber = userPreiserhebers.find(u => u.username === erheber.username);
                    if (!userPreiserheber) return null;
                    const erheberProps = allPropertiesExeceptIdAndRev(erheber);
                    const userPreiserheberProps = allPropertiesExeceptIdAndRev(userPreiserheber);
                    if (isEqual(erheberProps, userPreiserheberProps)) return null;
                    return assign({}, erheber, userPreiserheberProps);
                })
                .filter(newErheber => !!newErheber)
        )
        .flatMap(newErhebers => getDatabaseAsObservable(dbNames.preiserheber).flatMap(db => db.bulkDocs(newErhebers)));
}
