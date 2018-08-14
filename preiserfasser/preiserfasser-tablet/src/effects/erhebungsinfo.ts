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
import { Store } from '@ngrx/store';

import * as fromRoot from '../reducers';
import { getDatabaseAsObservable } from './pouchdb-utils';

@Injectable()
export class ErhebungsInfoEffects {
    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadErheubngsInfoEffects$ = this.actions$
        .ofType('LOAD_ERHEBUNGSINFO')
        .flatMap(() => getDatabaseAsObservable())
        .flatMap(db => db.get('erhebungsmonat').then((erhebungsmonatDoc: any) => ({ db, erhebungsmonat: erhebungsmonatDoc.monthAsString })))
        .flatMap(x => x.db.get('erhebungsorgannummer').then((erhebungsorgannummerDoc: any) => ({ erhebungsmonat: x.erhebungsmonat, erhebungsorgannummer: erhebungsorgannummerDoc.value })))
        .map(payload => ({ type: 'LOAD_ERHEBUNGSINFO_SUCCESS', payload }));
}
