import { assign, isEqual } from 'lodash';
import { forkJoin } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';

import { allPropertiesExeceptIdAndRev, Models as P } from '@lik-shared';

import { dbNames, getAllDocumentsFromDb, getDatabaseAsObservable, listUserDatabases } from '../common/pouchdb-utils';

export function copyUserDbErheberDetailsToPreiserheberDb() {
    return listUserDatabases().pipe(
        flatMap(dbs =>
            forkJoin(
                dbs.map(dbName =>
                    getDatabaseAsObservable(dbName).pipe(flatMap(db => db.get<P.Erheber>('preiserheber'))),
                ),
            ),
        ),
        flatMap(userPreiserhebers =>
            getDatabaseAsObservable(dbNames.preiserheber).pipe(
                flatMap(db => getAllDocumentsFromDb<P.Erheber>(db)),
                map(erhebers => ({ erhebers, userPreiserhebers })),
            ),
        ),
        map(({ erhebers, userPreiserhebers }) =>
            erhebers
                .map(erheber => {
                    const userPreiserheber = userPreiserhebers.find(u => u.username === erheber.username);
                    if (!userPreiserheber) return null;
                    const erheberProps = allPropertiesExeceptIdAndRev(erheber);
                    const userPreiserheberProps = allPropertiesExeceptIdAndRev(userPreiserheber);
                    if (isEqual(erheberProps, userPreiserheberProps)) return null;
                    return assign({}, erheber, userPreiserheberProps);
                })
                .filter(newErheber => !!newErheber),
        ),
        flatMap(newErhebers =>
            getDatabaseAsObservable(dbNames.preiserheber).pipe(flatMap(db => db.bulkDocs(newErhebers))),
        ),
    );
}

export function formatMessages(message: string) {
    return message.replace(new RegExp('(¶|\\\\n)', 'g'), '<br>');
}

export function formatArtikeltext(artikeltext: string) {
    return artikeltext ? artikeltext.replace(new RegExp('(\n|\\\\n)', 'g'), '<br>') : '';
}
