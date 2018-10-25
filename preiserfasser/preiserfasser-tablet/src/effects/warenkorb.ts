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
import { Effect, Actions } from '@ngrx/effects';

import { getDatabase } from './pouchdb-utils';

@Injectable()
export class WarenkorbEffects {
    constructor(private actions$: Actions) { }

    @Effect()
    loadPreismeldestellen$ = this.actions$
        .ofType('LOAD_WARENKORB')
        .flatMap(() => getDatabase())
        .flatMap(db => db.get('warenkorb')
            .then((warenkorb: any) => ({ type: 'LOAD_WARENKORB_SUCCESS', payload: warenkorb.products }))
            .catch(() => ({ type: 'LOAD_WARENKORB_FAIL' }))
        );
}
