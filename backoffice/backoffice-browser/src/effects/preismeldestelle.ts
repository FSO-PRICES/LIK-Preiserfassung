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
import { find } from 'lodash';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as preismeldestelle from '../actions/preismeldestelle';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import {
    dbNames,
    getAllDocumentsFromDb,
    getDatabase,
    getDatabaseAsObservable,
    getUserDatabaseName,
} from '../common/pouchdb-utils';
import { CurrentPreismeldestelle } from '../reducers/preismeldestelle';
import { loadAllPreismeldestellen } from '../common/user-db-values';

@Injectable()
export class PreismeldestelleEffects {
    currentPreismeldestelle$ = this.store.select(fromRoot.getCurrentPreismeldestelle);
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadPreismeldestelle$ = this.actions$
        .ofType('PREISMELDESTELLE_LOAD')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => loadAllPreismeldestellen())
        .map(docs => ({ type: 'PREISMELDESTELLE_LOAD_SUCCESS', payload: docs } as preismeldestelle.Action));

    @Effect()
    savePreismeldestelle$ = this.actions$
        .ofType('SAVE_PREISMELDESTELLE')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .withLatestFrom(this.currentPreismeldestelle$, (action, currentPreismeldestelle: CurrentPreismeldestelle) => ({
            currentPreismeldestelle,
        }))
        .flatMap(({ currentPreismeldestelle }) =>
            findUserDbNameContainingPms(currentPreismeldestelle.pmsNummer).map(userDbName => ({
                currentPreismeldestelle,
                userDbName,
            }))
        )
        .flatMap(({ currentPreismeldestelle, userDbName }) =>
            Observable.fromPromise(
                getDatabase(userDbName || dbNames.preismeldestellen)
                    .then(db => db.get(currentPreismeldestelle._id).then(doc => ({ db, doc })))
                    .then(({ db, doc }) =>
                        db
                            .put(
                                Object.assign({}, doc, <P.Preismeldestelle>{
                                    _id: currentPreismeldestelle._id,
                                    _rev: currentPreismeldestelle._rev,
                                    pmsNummer: currentPreismeldestelle.pmsNummer,
                                    preissubsystem: currentPreismeldestelle.preissubsystem,
                                    name: currentPreismeldestelle.name,
                                    supplement: currentPreismeldestelle.supplement,
                                    street: currentPreismeldestelle.street,
                                    postcode: currentPreismeldestelle.postcode,
                                    town: currentPreismeldestelle.town,
                                    telephone: currentPreismeldestelle.telephone,
                                    email: currentPreismeldestelle.email,
                                    internetLink: currentPreismeldestelle.internetLink,
                                    languageCode: currentPreismeldestelle.languageCode,
                                    erhebungsregion: currentPreismeldestelle.erhebungsregion,
                                    erhebungsart: currentPreismeldestelle.erhebungsart,
                                    pmsGeschlossen: currentPreismeldestelle.pmsGeschlossen,
                                    erhebungsartComment: currentPreismeldestelle.erhebungsartComment,
                                    zusatzInformationen: currentPreismeldestelle.zusatzInformationen,
                                    kontaktpersons: currentPreismeldestelle.kontaktpersons,
                                })
                            )
                            .then(response => ({ db, id: response.id }))
                    )
                    .then<CurrentPreismeldestelle>(({ db, id }) => db.get(id))
            )
        )
        .map(payload => ({ type: 'SAVE_PREISMELDESTELLE_SUCCESS', payload } as preismeldestelle.Action));
}

function findUserDbNameContainingPms(pmsNummerToFind: string) {
    return getDatabaseAsObservable(dbNames.preiszuweisungen)
        .flatMap(db => getAllDocumentsFromDb<P.Preiszuweisung>(db))
        .map(preiszuweisungen => {
            const preiszuweisung = find(preiszuweisungen, p =>
                p.preismeldestellenNummern.some(pmsNummer => pmsNummer === pmsNummerToFind)
            );
            return preiszuweisung ? getUserDatabaseName(preiszuweisung.preiserheberId) : null;
        });
}
