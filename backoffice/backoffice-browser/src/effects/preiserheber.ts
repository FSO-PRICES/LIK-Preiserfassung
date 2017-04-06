import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

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
        .map(docs => ({ type: 'PREISERHEBER_LOAD_SUCCESS', payload: docs } as preiserheber.Action))
    );

    @Effect()
    savePreiserheber$ = loggedIn(this.isLoggedIn, this.actions$.ofType('SAVE_PREISERHEBER'), savePreiserheber => savePreiserheber
        .withLatestFrom(this.currentPreiserheber$, (action, currentPreiserheber: CurrentPreiserheber) => ({ password: action.payload, currentPreiserheber }))
        .switchMap(({ password, currentPreiserheber }) =>
            getDatabase(dbNames.preiserheber)
                .then(db => { // Only check if the document exists if a revision already exists
                    if (!!currentPreiserheber._rev) {
                        return db.get(currentPreiserheber._id).then(doc => ({ db, doc }));
                    }
                    return Promise.resolve({ db, doc: {} });
                })
                .then(({ db, doc }) => { // Create or update the erheber
                    const create = !doc._rev;
                    const preiserheber = Object.assign({}, doc, {
                        _id: currentPreiserheber._id,
                        _rev: currentPreiserheber._rev,
                        firstName: currentPreiserheber.firstName,
                        surname: currentPreiserheber.surname,
                        personFunction: currentPreiserheber.personFunction,
                        languageCode: currentPreiserheber.languageCode,
                        telephone: currentPreiserheber.telephone,
                        email: currentPreiserheber.email
                    });
                    return (create ? db.post(preiserheber) : db.put(preiserheber))
                        .then((response) => ({ db, id: response.id, created: create }));
                })
                // Reload the created erheber
                .then(({ db, id, created }) => db.get(id).then(preiserheber => ({ preiserheber, created })))
                // Initialize a database for created erheber
                .then<CurrentPreiserheber>(({ preiserheber, created }) => (created ? createUser(preiserheber._id, password) : Promise.resolve(null)).then(() => preiserheber))
        )
        .map(payload => ({ type: 'SAVE_PREISERHEBER_SUCCESS', payload } as preiserheber.Action))
    );
}
