import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as preismeldestelle from '../actions/preismeldestelle';
import { getDatabase, dbNames } from './pouchdb-utils';
import { CurrentPreismeldestelle } from '../reducers/preismeldestelle';
import { loggedIn } from '../common/effects-extensions';

@Injectable()
export class PreismeldestelleEffects {
    currentPreismeldestelle$ = this.store.select(fromRoot.getCurrentPreismeldestelle);
    isLoggedIn = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreismeldestelle$ = loggedIn(this.isLoggedIn, this.actions$.ofType('PREISMELDESTELLE_LOAD'), loadPreismeldestelle => loadPreismeldestelle
        .switchMap(() => getDatabase(dbNames.preismeldestelle).then(db => ({ db })))
        .filter(({ db }) => db != null)
        .flatMap(x => x.db.allDocs(Object.assign({}, { include_docs: true })).then(res => ({ preismeldestellen: res.rows.map(y => y.doc) as P.AdvancedPreismeldestelle[] })))
        .map(docs => ({ type: 'PREISMELDESTELLE_LOAD_SUCCESS', payload: docs } as preismeldestelle.Action))
    );

    @Effect()
    savePreismeldestelle$ = loggedIn(this.isLoggedIn, this.actions$.ofType('SAVE_PREISMELDESTELLE'), savePreismeldestelle => savePreismeldestelle
        .withLatestFrom(this.currentPreismeldestelle$, (action, currentPreismeldestelle: CurrentPreismeldestelle) => ({ currentPreismeldestelle }))
        .switchMap(({ currentPreismeldestelle }) =>
            Observable.fromPromise(
                getDatabase(dbNames.preismeldestelle)
                    .then(db => db.get(currentPreismeldestelle._id).then(doc => ({ db, doc })))
                    .then(({ db, doc }) =>
                        db.put(Object.assign({}, doc, <P.AdvancedPreismeldestelle>{
                            _id: currentPreismeldestelle._id,
                            _rev: currentPreismeldestelle._rev,
                            pmsNummer: currentPreismeldestelle.pmsNummer,
                            name: currentPreismeldestelle.name,
                            supplement: currentPreismeldestelle.supplement,
                            kontaktpersons: currentPreismeldestelle.kontaktpersons,
                            street: currentPreismeldestelle.street,
                            postcode: currentPreismeldestelle.postcode,
                            town: currentPreismeldestelle.town,
                            regionId: currentPreismeldestelle.regionId,
                            languageCode: currentPreismeldestelle.languageCode,
                            telephone: currentPreismeldestelle.telephone,
                            email: currentPreismeldestelle.email,
                            erhebungsart: currentPreismeldestelle.erhebungsart,
                            erhebungsartComment: currentPreismeldestelle.erhebungsartComment,
                            erhebungshaeufigkeit: currentPreismeldestelle.erhebungshaeufigkeit
                        }))
                            .then((response) => ({ db, id: response.id }))
                    )
                    .then<CurrentPreismeldestelle>(({ db, id }) => db.get(id))
            )
        )
        .map(payload => ({ type: 'SAVE_PREISMELDESTELLE_SUCCESS', payload } as preismeldestelle.Action))
    );
}
