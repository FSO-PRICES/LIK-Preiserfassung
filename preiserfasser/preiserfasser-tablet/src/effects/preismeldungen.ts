import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';

import { getDatabase, getAllDocumentsForPrefix } from './pouchdb-utils';

@Injectable()
export class PreismeldungenEffects {
    constructor(private actions$: Actions) { }

    @Effect()
    loadPreismeldungen$ = this.actions$
        .ofType('PREISMELDUNGEN_LOAD_FOR_PMS')
        .switchMap(({ payload }) => getDatabase().then(db => ({ db, pmsKey: payload })))
        .flatMap(x => x.db.allDocs(Object.assign({}, getAllDocumentsForPrefix(`preismeldung/${x.pmsKey}`), { include_docs: true })))
        .map(allDocs => ({ type: 'PREISMELDUNGEN_LOAD_SUCCESS', payload: allDocs.rows.map(x => x.doc) }));
}
