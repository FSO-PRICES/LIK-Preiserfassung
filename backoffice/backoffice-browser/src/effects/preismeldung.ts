import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as preismeldung from '../actions/preismeldung';
import { getDatabase, dbNames, getAllDocumentsForPrefix } from './pouchdb-utils';
import { loggedIn } from '../common/effects-extensions';

@Injectable()
export class PreismeldungEffects {
    isLoggedIn = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreismeldung$ = loggedIn(this.isLoggedIn, this.actions$.ofType('PREISMELDUNG_LOAD'), loadPreismeldung => loadPreismeldung
        .switchMap(() => getDatabase(dbNames.preismeldung).then(db => ({ db })))
        .filter(({ db }) => db != null)
        .flatMap(x => x.db.allDocs(Object.assign({}, { include_docs: true }, getAllDocumentsForPrefix('pm-ref/'))).then(res => ({ preismeldungen: res.rows.map(y => y.doc) as P.CompletePreismeldung[] })))
        .map<preismeldung.Actions>(docs => ({ type: 'PREISMELDUNG_LOAD_SUCCESS', payload: docs }))
    );
}
