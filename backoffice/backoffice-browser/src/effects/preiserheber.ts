import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import * as fromRoot from '../reducers';
import * as preiserheber from '../actions/preiserheber';
import { getDatabase, createUser, dbNames } from './pouchdb-utils';
import { Models as P, CurrentPreiserheber } from '../common-models';
import { loggedIn } from '../common/effects-extensions';

@Injectable()
export class PreiserheberEffects {
    currentPreiserheber$ = this.store.select(fromRoot.getCurrentPreiserheber);
    isLoggedIn = this.store.select(fromRoot.getIsLoggedIn).publishReplay(1).refCount();

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreiserheber$ = loggedIn(this.isLoggedIn, this.actions$.ofType('PREISERHEBER_LOAD'), loadPreiserheber => loadPreiserheber
        .switchMap(() => getDatabase(dbNames.preiserheber).then(db => ({ db })))
        .filter(({ db }) => db != null)
        .flatMap(x => x.db.allDocs(Object.assign({}, { include_docs: true })).then(res => ({ preiserhebers: res.rows.map(y => y.doc) as P.Erheber[] })))
        .map<preiserheber.Actions>(docs => ({ type: 'PREISERHEBER_LOAD_SUCCESS', payload: docs }))
    );

    @Effect()
    savePreiserheber$ = loggedIn(this.isLoggedIn, this.actions$.ofType('SAVE_PREISERHEBER'), savePreiserheber => savePreiserheber
        .withLatestFrom(this.currentPreiserheber$, (action, currentPreiserheber: CurrentPreiserheber) => ({ password: action.payload, currentPreiserheber }))
        .switchMap<CurrentPreiserheber>(({ password, currentPreiserheber }) => {
            return getDatabase(dbNames.preiserheber)
                .then(db => { // Only check if the document exists if a revision not already exists
                    if (!!currentPreiserheber._rev) {
                        return db.get(currentPreiserheber._id).then(doc => ({ db, doc }));
                    }
                    return new Promise<{ db, doc }>((resolve, _) => resolve({ db, doc: {} }));
                })
                .then(({ db, doc }) => { // Create or update the erheber
                    const create = !doc._rev;
                    const dbOperation = (create ? db.post : db.put).bind(db);
                    return dbOperation(Object.assign({}, doc, {
                        _id: currentPreiserheber._id,
                        _rev: currentPreiserheber._rev,
                        firstName: currentPreiserheber.firstName,
                        surname: currentPreiserheber.surname,
                        personFunction: currentPreiserheber.personFunction,
                        languageCode: currentPreiserheber.languageCode,
                        telephone: currentPreiserheber.telephone,
                        email: currentPreiserheber.email
                    })).then((response) => ({ db, id: response.id, created: create }));
                })
                // Reload the created erheber
                .then<CurrentPreiserheber>(({ db, id, created }) => db.get(id).then(preiserheber => Object.assign({}, preiserheber, { isModified: false, isSaved: true, isCreated: created })))
                // Initialize a database for created erheber
                .then(erheber => (erheber.isCreated ? createUser(erheber._id, password) : Promise.resolve(null)).then(() => erheber));
        })
        .map<preiserheber.Actions>(payload => ({ type: 'SAVE_PREISERHEBER_SUCCESS', payload }))
    );
}
