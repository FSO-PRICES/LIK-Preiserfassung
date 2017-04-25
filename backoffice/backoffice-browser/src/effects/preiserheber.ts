import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { has } from 'lodash';

import * as fromRoot from '../reducers';
import * as preiserheber from '../actions/preiserheber';
import * as preiszuweisung from '../actions/preiszuweisung';
import { getDatabase, dropDatabase, createUser, dbNames, getUserDatabaseName, deleteUser, updateUser } from './pouchdb-utils';
import { Models as P, CurrentPreiserheber } from '../common-models';
import { loggedIn } from '../common/effects-extensions';

@Injectable()
export class PreiserheberEffects {
    currentPreiserheber$ = this.store.select(fromRoot.getCurrentPreiserheber);
    isLoggedIn = this.store.select(fromRoot.getIsLoggedIn).publishReplay(1).refCount();

    private errorCodes: { [code: string]: string } = {
        '409': 'Es gibt schon ein Preiserheber mit diesem Benutzernamen.'
    };

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
    resetPassword$ = loggedIn(this.isLoggedIn, this.actions$.ofType('RESET_PASSWORD'), resetPassword$ => resetPassword$
        .withLatestFrom(this.currentPreiserheber$, (action, preiserheber) => ({ password: action.payload, preiserheber }))
        .switchMap(({ password, preiserheber }) => updateUser(preiserheber, password).then(() => true).catch(error => false))
        .map(success => success ?
            { type: 'RESET_PASSWORD_SUCCESS', payload: null } :
            { type: 'RESET_PASSWORD_FAILURE', payload: 'Password ist ungültig' }
        )
    );

    @Effect()
    deletePreiserheber$ = loggedIn(this.isLoggedIn, this.actions$.ofType('DELETE_PREISERHEBER'), deletePreiserheber$ => deletePreiserheber$
        .flatMap(action => deletePreiserheber(action.payload).then(success => ({ preiserheberId: action.payload._id as string, success })))
        .flatMap(({ preiserheberId, success }) => [
            { type: 'DELETE_PREISZUWEISUNG_SUCCESS' } as preiszuweisung.Action,
            success ?
                { type: 'DELETE_PREISERHEBER_SUCCESS', payload: preiserheberId } as preiserheber.Action :
                { type: 'DELETE_PREISERHEBER_FAILURE', payload: preiserheberId } as preiserheber.Action
        ])
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
                        mobilephone: currentPreiserheber.mobilephone,
                        email: currentPreiserheber.email,
                        fax: currentPreiserheber.fax,
                        webseite: currentPreiserheber.webseite,
                        street: currentPreiserheber.street,
                        postcode: currentPreiserheber.postcode,
                        town: currentPreiserheber.town,
                        preissubsystem: currentPreiserheber.preissubsystem
                    });
                    return (create ? db.post(preiserheber) : db.put(preiserheber))
                        .then((response) => ({ db, id: response.id, created: create }));
                })
                // Reload the created erheber
                .then(({ db, id, created }) => db.get(id).then((preiserheber: P.Erheber) => ({ preiserheber, created })))
                // Initialize a database for created erheber
                .then(({ preiserheber, created }) => (created ? createUser(preiserheber, password) : updateUser(preiserheber, password)).then(() => ({ preiserheber, error: null })))
                .catch(error => ({ preiserheber: null as P.Erheber, error: this.getErrorText(error) }))
        )
        .map(result => !result.error ?
            { type: 'SAVE_PREISERHEBER_SUCCESS', payload: result.preiserheber } as preiserheber.Action :
            { type: 'SAVE_PREISERHEBER_FAILURE', payload: result.error } as preiserheber.Action
        )
    );

    private getErrorText(error: any) {
        if (!error || !has(error, 'status')) throw error;
        return this.errorCodes[error.status.toString()] || error.message;
    }
}

function deletePreiserheber(preiserheber: P.Erheber): Promise<boolean> {
    // TODO: ? Delete synced Preismeldungen ? (necessary? if yes how to handle)
    return getDatabase(dbNames.preiserheber)
        // Delete preiserheber/{id}
        .then(preiserheberDb =>
            preiserheberDb.get(preiserheber._id).then((doc: P.Erheber) => preiserheberDb.remove(doc).then(() => true))
        )
        // Delete user
        .then(success => deleteUser(preiserheber._id).then(deleted => success && deleted))
        // Delete preiszuweisungen
        .then(success => getDatabase(dbNames.preiszuweisung).then(preiszuweisungDb =>
            preiszuweisungDb.get(preiserheber._id).then((doc: P.CouchProperties) => preiszuweisungDb.put(Object.assign({}, doc, { _deleted: true, preismeldestellen: [] })))
                .then(() => success)
                .catch(error => {
                    if (!!error && error.status !== 404) {
                        throw error; // Ignore 404 errors because it means there weren't any to delete
                    }
                    return true;
                })
        ))
        // Delete preiserheber db 'user_{id}' or rename to 'deleted_user_{id}'
        .then(success => dropDatabase(getUserDatabaseName(preiserheber)).then(() => success))
        .catch(error => {
            console.log('[Error] Error occurred while deleting preiserheber. [preiserheber, error]', preiserheber, error);
            return false;
        });
}
