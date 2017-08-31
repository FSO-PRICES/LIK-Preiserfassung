import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { assign } from 'lodash';

import { Models as P } from 'lik-shared';

import { getDatabase, dbNames, getAllDocumentsForPrefix } from './pouchdb-utils';
import { loadPreismeldungenAndRefPreismeldungForPms } from '../common/user-db-values';
import { Action } from '../actions/preismeldung';
import * as fromRoot from '../reducers';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import { CurrentPreismeldungBag } from '../reducers/preismeldung';
import { Observable } from 'rxjs';

@Injectable()
export class PreismeldungEffects {
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldung);
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreismeldungenForPms$ = this.actions$.ofType('PREISMELDUNGEN_LOAD_FOR_PMS')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(({ payload: pmsNummer }) => loadPreismeldungenAndRefPreismeldungForPms(pmsNummer))
        .withLatestFrom(this.store.select(fromRoot.getWarenkorbState), (x, warenkorb) => assign({}, x, { warenkorb, pmsPreismeldungenSort: null }))
        .map(docs => ({ type: 'PREISMELDUNGEN_LOAD_SUCCESS', payload: docs } as Action));

    // @Effect()
    // loadPreismeldungen$ = this.actions$.ofType('PREISMELDUNG_LOAD_UNEXPORTED')
    //     .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
    //     .flatMap(() => getDatabase(dbNames.preismeldung).then(db => ({ db })))
    //     .filter(({ db }) => db != null)
    //     .flatMap(x => x.db.allDocs(Object.assign({}, { include_docs: true }, getAllDocumentsForPrefix('pm-ref/'))).then(res => res.rows.map(y => y.doc) as P.CompletePreismeldung[]))
    //     .map(docs => ({ type: 'PREISMELDUNG_LOAD_UNEXPORTED_SUCCESS', payload: docs } as Action));

    // @Effect()
    // savePreismeldung$ = this.actions$.ofType('SAVE_PREISMELDUNG')
    //     .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
    //     .withLatestFrom(this.currentPreismeldung$, (action, currentPreismeldung: CurrentPreismeldungBag) => ({ currentPreismeldung }))
    //     .flatMap(({ currentPreismeldung: bag }) =>
    //         Observable.fromPromise(
    //             getDatabase(dbNames.preismeldung)
    //                 .then(db => { // Only check if the document exists if a revision already exists
    //                     if (!!bag.preismeldung._rev) {
    //                         return db.get(bag.preismeldung._id).then(doc => ({ db, doc }));
    //                     }
    //                     return Promise.resolve({ db, doc: {} });
    //                 })
    //                 .then(({ db, doc }) => { // Create or update the preismeldung
    //                     const create = !doc._rev;
    //                     const preismeldung = Object.assign({}, doc, <P.Preismeldung>{
    //                         _id: bag.preismeldung._id,
    //                         _rev: bag.preismeldung._rev,
    //                         bemerkungen: bag.preismeldung.bemerkungen
    //                     });
    //                     return (create ? db.post(preismeldung) : db.put(preismeldung))
    //                         .then((response) => ({ db, id: response.id }));
    //                 })
    //                 .then<P.Preismeldung>(({ db, id }) => db.get(id))
    //         )
    //     )
    //     .map(payload => ({ type: 'SAVE_PREISMELDUNG_SUCCESS', payload } as Action));
}

// function loadAllPreismeldungen(pmsNummer: string = '') {
//     return getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>(`pm/${pmsNummer}`)
//         .flatMap((preismeldungen: any[]) => getDatabaseAsObservable(dbNames.preismeldung)
//             .flatMap(db => getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(db, `pm-ref/${pmsNummer}`).then(pmRefs => keyBy(pmRefs, pmRef => getPreismeldungId(pmRef))))
//             .map(pmRefs => preismeldungen.map(pm => assign({}, pm, { pmRef: pmRefs[getPreismeldungId(pm)] }) as P.Preismeldung & { pmRef: P.PreismeldungReference }))
//         );
// }
