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

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as preiszuweisung from '../actions/preiszuweisung';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import { getDatabase, dbNames } from '../common/pouchdb-utils';
import { CurrentPreiszuweisung } from '../reducers/preiszuweisung';

@Injectable()
export class PreiszuweisungEffects {
    currentPreiszuweisung$ = this.store.select(fromRoot.getCurrentPreiszuweisung);
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreiszuweisung$ = this.actions$.ofType('PREISZUWEISUNG_LOAD')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => getDatabase(dbNames.preiszuweisungen).then(db => ({ db })))
        .filter(({ db }) => db != null)
        .flatMap(x => x.db.allDocs(Object.assign({}, { include_docs: true })).then(res => res.rows.map(y => y.doc) as P.Preiszuweisung[]))
        .map(docs => ({ type: 'PREISZUWEISUNG_LOAD_SUCCESS', payload: docs } as preiszuweisung.Action));
}
