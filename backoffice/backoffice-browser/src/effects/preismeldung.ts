import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { assign } from 'lodash';

import { Models as P } from 'lik-shared';

import { getDatabase, dbNames, getAllDocumentsForPrefix } from './pouchdb-utils';
import * as preismeldung from '../actions/preismeldung';
import * as fromRoot from '../reducers';
import { CurrentPreismeldung } from '../reducers/preismeldung';
import { loggedIn } from '../common/effects-extensions';
import { Observable } from 'rxjs';

@Injectable()
export class PreismeldungEffects {
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldung);
    isLoggedIn = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreismeldungenForPms$ = loggedIn(this.isLoggedIn, this.actions$.ofType('PREISMELDUNG_LOAD_FOR_PMS'), loadPreismeldung => loadPreismeldung
        .switchMap(({ payload }) => getDatabase(dbNames.preismeldung).then(db => ({ db, pmsNummer: payload })))
        .flatMap(x => x.db.allDocs(assign({}, getAllDocumentsForPrefix(`pm-ref/${x.pmsNummer}`), { include_docs: true })).then(res => ({ db: x.db, pmsNummer: x.pmsNummer, pmRefs: res.rows.map(y => y.doc) as P.PreismeldungReference[] })))
        .flatMap(x => x.db.allDocs(assign({}, getAllDocumentsForPrefix(`pm-ref/${x.pmsNummer}`), { include_docs: true })).then(res => ({ db: x.db, pmsNummer: x.pmsNummer, refPreismeldungen: x.pmRefs, preismeldungen: res.rows.map(y => y.doc) as P.Preismeldung[] }))) // TODO: for testing purposes pm/${x.pmsNummer} has been changed to pm-ref/${x.pmsNummer} // TODO REMOVE!!
        .flatMap(x => getDatabase(dbNames.preismeldestelle).then(db => db.get(`pms/${x.pmsNummer}`).then(res => res as P.Preismeldestelle).then((pms: P.Preismeldestelle) => ({
            db: x.db,
            pms,
            refPreismeldungen: x.refPreismeldungen,
            preismeldungen: x.preismeldungen,
        }))))
        .flatMap(x => getDatabase(dbNames.warenkorb).then(db => db.get('warenkorb')).then((warenkorbDoc: P.WarenkorbDocument) => ({
            pms: x.pms,
            warenkorbDoc,
            refPreismeldungen: x.refPreismeldungen,
            preismeldungen: x.preismeldungen,
        })))
        .map(docs => ({ type: 'PREISMELDUNG_LOAD_FOR_PMS_SUCCESS', payload: docs } as preismeldung.Action))
    );

    @Effect()
    loadPreismeldungen$ = loggedIn(this.isLoggedIn, this.actions$.ofType('PREISMELDUNG_LOAD_UNEXPORTED'), loadPreismeldung => loadPreismeldung
        .switchMap(() => getDatabase(dbNames.preismeldung).then(db => ({ db })))
        .filter(({ db }) => db != null)
        .flatMap(x => x.db.allDocs(Object.assign({}, { include_docs: true }, getAllDocumentsForPrefix('pm-ref/'))).then(res => res.rows.map(y => y.doc) as P.CompletePreismeldung[]))
        .map(docs => ({ type: 'PREISMELDUNG_LOAD_UNEXPORTED_SUCCESS', payload: docs } as preismeldung.Action))
    );

    @Effect()
    savePreismeldung$ = loggedIn(this.isLoggedIn, this.actions$.ofType('SAVE_PREISMELDUNG'), savePreismeldung => savePreismeldung
        .withLatestFrom(this.currentPreismeldung$, (action, currentPreismeldung: CurrentPreismeldung) => ({ currentPreismeldung }))
        .switchMap(({ currentPreismeldung }) =>
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
        .map(payload => ({ type: 'SAVE_PREISMELDUNG_SUCCESS', payload } as preismeldung.Action))
    );
}
