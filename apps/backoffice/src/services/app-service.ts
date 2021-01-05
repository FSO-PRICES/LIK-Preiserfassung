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

import { Injectable } from '@angular/core';

import { dbNames, dropLocalDatabase } from '../common/pouchdb-utils/database';

@Injectable()
export class AppService {
    async clearLocalDatabases() {
        await dropLocalDatabase(dbNames.preiserheber);
        await dropLocalDatabase(dbNames.preismeldungen);
        await dropLocalDatabase(dbNames.preismeldungen_status);
        await dropLocalDatabase(dbNames.preiszuweisungen);
        await dropLocalDatabase(dbNames.exports);
        return console.log('Cleared local databases');
    }
}
