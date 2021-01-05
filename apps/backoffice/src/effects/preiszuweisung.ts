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
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, flatMap, map } from 'rxjs/operators';

import { Models as P } from '@lik-shared';

import * as preiszuweisung from '../actions/preiszuweisung';
import { blockIfNotLoggedIn } from '../common/effects-extensions';
import { dbNames, getDatabase } from '../common/pouchdb-utils';
import * as fromRoot from '../reducers';

@Injectable()
export class PreiszuweisungEffects {
    currentPreiszuweisung$ = this.store.select(fromRoot.getCurrentPreiszuweisung);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadPreiszuweisung$ = this.actions$.pipe(
        ofType('PREISZUWEISUNG_LOAD'),
        blockIfNotLoggedIn(this.store),
        flatMap(() => getDatabase(dbNames.preiszuweisungen).then(db => ({ db }))),
        filter(({ db }) => db != null),
        flatMap(x =>
            x.db
                .allDocs(Object.assign({}, { include_docs: true }))
                .then(res => res.rows.map(y => y.doc) as P.Preiszuweisung[]),
        ),
        map(docs => ({ type: 'PREISZUWEISUNG_LOAD_SUCCESS', payload: docs } as preiszuweisung.Action)),
    );
}
