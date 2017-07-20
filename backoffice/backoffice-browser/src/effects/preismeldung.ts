import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { Models as P } from 'lik-shared';

import { getDatabase, dbNames, getAllDocumentsForPrefix } from './pouchdb-utils';
import { Action } from '../actions/preismeldung';
import * as fromRoot from '../reducers';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import { CurrentPreismeldung } from '../reducers/preismeldung';
import { Observable } from 'rxjs';
import { loadAllPreismeldungen } from '../common/user-db-values';

@Injectable()
export class PreismeldungEffects {
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldung);
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreismeldungenForPms$ = this.actions$.ofType('PREISMELDUNG_LOAD_FOR_PMS')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(({ payload }) => loadAllPreismeldungen(payload).map(preismeldungen => ({ pmsNummer: payload, preismeldungen })))
        .flatMap(x => getDatabase(dbNames.preismeldestelle).then(db => db.get(`pms/${x.pmsNummer}`).then(res => res as P.Preismeldestelle).then((pms: P.Preismeldestelle) => ({
            pms,
            preismeldungen: x.preismeldungen
        }))))
        .flatMap(x => getDatabase(dbNames.warenkorb).then(db => db.get('warenkorb')).then((warenkorbDoc: P.WarenkorbDocument) => ({
            pms: x.pms,
            warenkorbDoc,
            preismeldungen: x.preismeldungen,
        })))
        .map(docs => ({ type: 'PREISMELDUNG_LOAD_FOR_PMS_SUCCESS', payload: docs } as Action));

    @Effect()
    loadPreismeldungen$ = this.actions$.ofType('PREISMELDUNG_LOAD_UNEXPORTED')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => getDatabase(dbNames.preismeldung).then(db => ({ db })))
        .filter(({ db }) => db != null)
        .flatMap(x => x.db.allDocs(Object.assign({}, { include_docs: true }, getAllDocumentsForPrefix('pm-ref/'))).then(res => res.rows.map(y => y.doc) as P.CompletePreismeldung[]))
        .map(docs => ({ type: 'PREISMELDUNG_LOAD_UNEXPORTED_SUCCESS', payload: docs } as Action));

    @Effect()
    savePreismeldung$ = this.actions$.ofType('SAVE_PREISMELDUNG')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .withLatestFrom(this.currentPreismeldung$, (action, currentPreismeldung: CurrentPreismeldung) => ({ currentPreismeldung }))
        .flatMap(({ currentPreismeldung }) =>
            Observable.fromPromise(
                getDatabase(dbNames.preismeldung)
                    .then(db => { // Only check if the document exists if a revision already exists
                        if (!!currentPreismeldung._rev) {
                            return db.get(currentPreismeldung._id).then(doc => ({ db, doc }));
                        }
                        return Promise.resolve({ db, doc: {} });
                    })
                    .then(({ db, doc }) => { // Create or update the preismeldung
                        const create = !doc._rev;
                        const preismeldung = Object.assign({}, doc, <P.Preismeldung>{
                            _id: currentPreismeldung._id,
                            _rev: currentPreismeldung._rev,
                            bemerkungen: currentPreismeldung.bemerkungen
                        });
                        return (create ? db.post(preismeldung) : db.put(preismeldung))
                            .then((response) => ({ db, id: response.id }));
                    })
                    .then<CurrentPreismeldung>(({ db, id }) => db.get(id))
            )
        )
        .map(payload => ({ type: 'SAVE_PREISMELDUNG_SUCCESS', payload } as Action));
}
