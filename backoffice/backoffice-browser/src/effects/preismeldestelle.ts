import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as preismeldestelle from '../actions/preismeldestelle';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import { getDatabase, dbNames, getAllDocumentsForPrefixFromDb } from './pouchdb-utils';
import { CurrentPreismeldestelle } from '../reducers/preismeldestelle';

@Injectable()
export class PreismeldestelleEffects {
    currentPreismeldestelle$ = this.store.select(fromRoot.getCurrentPreismeldestelle);
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreismeldestelle$ = this.actions$.ofType('PREISMELDESTELLE_LOAD')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => getDatabase(dbNames.preismeldestelle).then(db => ({ db })))
        .filter(({ db }) => db != null)
        .flatMap(({ db }) => getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(db, 'pms'))
        .map(docs => ({ type: 'PREISMELDESTELLE_LOAD_SUCCESS', payload: docs } as preismeldestelle.Action));

    @Effect()
    savePreismeldestelle$ = this.actions$.ofType('SAVE_PREISMELDESTELLE')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .withLatestFrom(this.currentPreismeldestelle$, (action, currentPreismeldestelle: CurrentPreismeldestelle) => ({ currentPreismeldestelle }))
        .flatMap(({ currentPreismeldestelle }) =>
            Observable.fromPromise(
                getDatabase(dbNames.preismeldestelle)
                    .then(db => db.get(currentPreismeldestelle._id).then(doc => ({ db, doc })))
                    .then(({ db, doc }) =>
                        db.put(Object.assign({}, doc, <P.Preismeldestelle>{
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
                            languageCode: currentPreismeldestelle.languageCode,
                            erhebungsregion: currentPreismeldestelle.erhebungsregion,
                            erhebungsart: currentPreismeldestelle.erhebungsart,
                            erhebungshaeufigkeit: currentPreismeldestelle.erhebungshaeufigkeit,
                            erhebungsartComment: currentPreismeldestelle.erhebungsartComment,
                            zusatzInformationen: currentPreismeldestelle.zusatzInformationen,
                            kontaktpersons: currentPreismeldestelle.kontaktpersons,
                            active: currentPreismeldestelle.active
                        }))
                            .then((response) => ({ db, id: response.id }))
                    )
                    .then<CurrentPreismeldestelle>(({ db, id }) => db.get(id))
            )
        )
        .map(payload => ({ type: 'SAVE_PREISMELDESTELLE_SUCCESS', payload } as preismeldestelle.Action));
}
