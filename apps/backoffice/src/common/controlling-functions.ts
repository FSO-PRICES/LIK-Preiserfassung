/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

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
    return (message || '').replace(new RegExp('(¶|\\\\n)', 'g'), '<br>');
}

export function formatArtikeltext(artikeltext: string) {
    return artikeltext ? artikeltext.replace(new RegExp('(\n|\\\\n)', 'g'), '<br>') : '';
}
