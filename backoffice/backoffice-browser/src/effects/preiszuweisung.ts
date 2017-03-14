import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as preiszuweisung from '../actions/preiszuweisung';
import { getDatabase, dbNames } from './pouchdb-utils';
import { CurrentPreiszuweisung } from '../reducers/preiszuweisung';
import { loggedIn } from '../common/effects-extensions';

@Injectable()
export class PreiszuweisungEffects {
    currentPreiszuweisung$ = this.store.select(fromRoot.getCurrentPreiszuweisung);
    isLoggedIn = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreiszuweisung$ = loggedIn(this.isLoggedIn, this.actions$.ofType('PREISZUWEISUNG_LOAD'), loadPreiszuweisung => loadPreiszuweisung
        .switchMap(() => getDatabase(dbNames.preiszuweisung).then(db => ({ db })))
        .filter(({ db }) => db != null)
        .flatMap(x => x.db.allDocs(Object.assign({}, { include_docs: true })).then(res => ({ preiszuweisungen: res.rows.map(y => y.doc) as P.Preiszuweisung[] })))
        .map<preiszuweisung.Actions>(docs => ({ type: 'PREISZUWEISUNG_LOAD_SUCCESS', payload: docs }))
    );

    @Effect()
    savePreiszuweisung$ = loggedIn(this.isLoggedIn, this.actions$.ofType('SAVE_PREISZUWEISUNG'), savePreiszuweisung => savePreiszuweisung
        .withLatestFrom(this.currentPreiszuweisung$, (action, currentPreiszuweisung: CurrentPreiszuweisung) => ({ currentPreiszuweisung }))
        .switchMap<CurrentPreiszuweisung>(({ currentPreiszuweisung }) => {
            return getDatabase(dbNames.preiszuweisung)
                .then(db => { // Only check if the document exists if is not a newly created one
                    if (!currentPreiszuweisung.isNew) {
                        return db.get(currentPreiszuweisung._id).then(doc => ({ db, doc, create: false }));
                    }
                    return new Promise<{ db, doc, create }>((resolve, _) => resolve({ db, doc: {}, create: true }));
                })
                .then(({ db, doc, create }) => {
                    const data: P.Preiszuweisung = Object.assign({},
                        doc,
                        <P.Preiszuweisung>{
                            _id: create ? currentPreiszuweisung.preiserheberId : currentPreiszuweisung._id,
                            _rev: currentPreiszuweisung._rev,
                            preiserheberId: currentPreiszuweisung.preiserheberId,
                            preismeldestellen: currentPreiszuweisung.preismeldestellen
                        }
                    );
                    return db.put(data).then((response) => {
                        return ({ db, id: response.id, created: create })
                    });
                })
                .then<CurrentPreiszuweisung>(({ db, id }) => db.get(id).then(preiszuweisung => Object.assign({}, preiszuweisung, { isModified: false, isSaved: true })));
        })
        .map<preiszuweisung.Actions>(payload => ({ type: 'CREATE_USER_DATABASE', payload }))
    );
}
