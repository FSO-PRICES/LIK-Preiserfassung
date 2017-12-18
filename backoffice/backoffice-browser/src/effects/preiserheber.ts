import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { has, assign } from 'lodash';

import * as fromRoot from '../reducers';
import { Action } from '../actions/preiserheber';
import * as preiszuweisungActions from '../actions/preiszuweisung';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import {
    getDatabase,
    getDatabaseAsObservable,
    dropRemoteCouchDatabase,
    createOrUpdateUser,
    updateUser,
    dbNames,
    getUserDatabaseName,
    deleteUser,
} from './pouchdb-utils';
import { Models as P, CurrentPreiserheber } from '../common-models';
import { createUserDb, updateUserAndZuweisungDb } from '../common/preiserheber-initialization';
import { loadAllPreiserheber, loadPreiserheber, updatePreiserheber } from '../common/user-db-values';

@Injectable()
export class PreiserheberEffects {
    currentPreiserheber$ = this.store.select(fromRoot.getCurrentPreiserheber);
    currentPreiszuweisung$ = this.store.select(fromRoot.getCurrentPreiszuweisung);
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    private errorCodes: { [code: string]: string } = {
        '409': 'Es gibt schon ein Preiserheber mit diesem Benutzernamen.',
    };

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadPreiserheber$ = this.actions$
        .ofType('PREISERHEBER_LOAD')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => loadAllPreiserheber())
        .map(docs => ({ type: 'PREISERHEBER_LOAD_SUCCESS', payload: docs } as Action));

    @Effect()
    resetPassword$ = this.actions$
        .ofType('RESET_PASSWORD')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .withLatestFrom(this.currentPreiserheber$, (action, preiserheber) => ({
            password: action.payload,
            preiserheber,
        }))
        .flatMap(({ password, preiserheber }) =>
            updateUser(preiserheber, password)
                .then(() => true)
                .catch(error => false)
        )
        .map(
            success =>
                success
                    ? { type: 'RESET_PASSWORD_SUCCESS', payload: null }
                    : { type: 'RESET_PASSWORD_FAILURE', payload: 'Password ist ungültig' }
        );

    @Effect()
    deletePreiserheber$ = this.actions$
        .ofType('DELETE_PREISERHEBER')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(action =>
            deletePreiserheber(action.payload).then(success => ({
                preiserheberId: action.payload._id as string,
                success,
            }))
        )
        .flatMap(({ preiserheberId, success }) => [
            { type: 'DELETE_PREISZUWEISUNG_SUCCESS' } as preiszuweisungActions.Action,
            success
                ? ({ type: 'DELETE_PREISERHEBER_SUCCESS', payload: preiserheberId } as Action)
                : ({ type: 'DELETE_PREISERHEBER_FAILURE', payload: preiserheberId } as Action),
        ]);

    @Effect()
    savePreiserheber$ = this.actions$
        .ofType('SAVE_PREISERHEBER')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .withLatestFrom(this.currentPreiserheber$, (action, currentPreiserheber) => ({
            password: action.payload,
            currentPreiserheber,
        }))
        .flatMap(({ password, currentPreiserheber }) =>
            getDatabase(dbNames.preiserheber)
                .then(
                    db =>
                        !!currentPreiserheber._rev
                            ? db.get(currentPreiserheber._id).then(doc => ({ db, doc }))
                            : Promise.resolve({ db, doc: {} })
                )
                .then(({ db, doc }) => {
                    // Create or update the erheber
                    const create = !doc._rev;
                    const preiserheber = Object.assign({}, doc, {
                        _id: currentPreiserheber._id,
                        _rev: currentPreiserheber._rev,
                        peNummer: currentPreiserheber.peNummer || generatePeNummer(),
                        firstName: currentPreiserheber.firstName,
                        surname: currentPreiserheber.surname,
                        erhebungsregion: currentPreiserheber.erhebungsregion,
                        languageCode: currentPreiserheber.languageCode,
                        telephone: currentPreiserheber.telephone,
                        mobilephone: currentPreiserheber.mobilephone,
                        email: currentPreiserheber.email,
                        fax: currentPreiserheber.fax,
                        webseite: currentPreiserheber.webseite,
                        street: currentPreiserheber.street,
                        postcode: currentPreiserheber.postcode,
                        town: currentPreiserheber.town,
                        username: currentPreiserheber.username,
                    }) as P.Erheber;
                    return { db, create, preiserheber, password };
                })
        )
        .flatMap(
            ({ db, create, password, preiserheber }) =>
                create
                    ? db.post(preiserheber).then(() => ({ created: create, password, preiserheber }))
                    : Observable.of({ created: false, password, preiserheber })
        )
        .flatMap(({ preiserheber, created, password }) =>
            createOrUpdateUser(preiserheber, password)
                .map(() => ({ preiserheber, error: null, created }))
                .catch(error =>
                    Observable.of({ preiserheber: null as P.Erheber, error: this.getErrorText(error), created: false })
                )
        )
        .withLatestFrom(this.currentPreiszuweisung$, (result, currentPreiszuweisung) => ({
            result,
            currentPreiszuweisung,
        }))
        // Only create or update the user db if there was no error
        .flatMap(
            ({ result, currentPreiszuweisung }) =>
                !result.error
                    ? (result.created
                          ? createUserDb(result.preiserheber)
                          : updateUserAndZuweisungDb(result.preiserheber, currentPreiszuweisung)
                      ).map(error => assign(result, { error }))
                    : Observable.of(result)
        )
        // Reload saved preiserheber
        .flatMap(result =>
            loadPreiserheber(result.preiserheber._id).map(preiserheber => assign(result, { preiserheber }))
        )
        .flatMap(result =>
            getDatabaseAsObservable(dbNames.preiszuweisung)
                .flatMap(db => db.get(result.preiserheber._id))
                .map(preiszuweisung => assign(result, { preiszuweisung }))
        )
        .flatMap(
            result =>
                !result.error
                    ? [
                          { type: 'SAVE_PREISERHEBER_SUCCESS', payload: result.preiserheber },
                          { type: 'SAVE_PREISZUWEISUNG_SUCCESS', payload: result.preiszuweisung },
                      ]
                    : [
                          { type: 'SAVE_PREISERHEBER_FAILURE', payload: result.error },
                          { type: 'SAVE_PREISZUWEISUNG_FAILURE', payload: result.error },
                      ]
        );

    private getErrorText(error: any) {
        if (!error || !has(error, 'status')) throw error;
        return this.errorCodes[error.status.toString()] || error.message;
    }
}

function deletePreiserheber(preiserheber: P.Erheber): Promise<boolean> {
    // TODO: ? Delete synced Preismeldungen ? (necessary? if yes how to handle)
    return (
        getDatabase(dbNames.preiserheber)
            // Delete preiserheber/{id}
            .then(preiserheberDb =>
                preiserheberDb
                    .get(preiserheber._id)
                    .then((doc: P.Erheber) => preiserheberDb.remove(doc).then(() => true))
            )
            // Delete user
            .then(success => deleteUser(preiserheber._id).then(deleted => success && deleted))
            // Delete preiszuweisungen
            .then(success =>
                getDatabase(dbNames.preiszuweisung).then(preiszuweisungDb =>
                    preiszuweisungDb
                        .get(preiserheber._id)
                        .then((doc: P.CouchProperties) =>
                            preiszuweisungDb.put(Object.assign({}, doc, { _deleted: true, preismeldestellen: [] }))
                        )
                        .then(() => success)
                        .catch(error => {
                            if (!!error && error.status !== 404) {
                                throw error; // Ignore 404 errors because it means there weren't any to delete
                            }
                            return true;
                        })
                )
            )
            // Delete preiserheber db 'user_{id}' or rename to 'deleted_user_{id}'
            .then(success => dropRemoteCouchDatabase(getUserDatabaseName(preiserheber._id)).then(() => success))
            .catch(error => {
                console.log(
                    '[Error] Error occurred while deleting preiserheber. [preiserheber, error]',
                    preiserheber,
                    error
                );
                return false;
            })
    );
}

function generatePeNummer() {
    return Math.floor(new Date().getTime() / 1000);
}
