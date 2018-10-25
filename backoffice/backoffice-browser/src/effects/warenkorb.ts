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
import { Observable } from 'rxjs';

import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import * as fromRoot from '../reducers';
import { dbNames, getDatabaseAsObservable } from '../common/pouchdb-utils';

@Injectable()
export class WarenkorbEffects {
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadWarenkorb$ = this.actions$.ofType('LOAD_WARENKORB')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => getDatabaseAsObservable(dbNames.warenkorb)
            .flatMap(db => db.get('warenkorb'))
            .map((warenkorb: any) => ({ type: 'LOAD_WARENKORB_SUCCESS', payload: warenkorb.products }))
            .catch(err => Observable.of({ type: 'LOAD_WARENKORB_FAIL' }))
        );
}
