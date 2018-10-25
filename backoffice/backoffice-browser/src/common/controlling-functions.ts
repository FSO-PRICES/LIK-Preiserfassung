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

import { Observable } from 'rxjs';
import { assign, isEqual } from 'lodash';

import { listUserDatabases, getDatabaseAsObservable, dbNames, getAllDocumentsFromDb } from '../common/pouchdb-utils';
import { Models as P, allPropertiesExeceptIdAndRev } from 'lik-shared';

export function copyUserDbErheberDetailsToPreiserheberDb() {
    return listUserDatabases()
        .flatMap(dbs =>
            Observable.forkJoin(
                dbs.map(dbName => getDatabaseAsObservable(dbName).flatMap(db => db.get<P.Erheber>('preiserheber')))
            )
        )
        .flatMap(userPreiserhebers =>
            getDatabaseAsObservable(dbNames.preiserheber)
                .flatMap(db => getAllDocumentsFromDb<P.Erheber>(db))
                .map(erhebers => ({ erhebers, userPreiserhebers }))
        )
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
