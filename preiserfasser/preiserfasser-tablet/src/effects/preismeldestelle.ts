import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';

import { getDatabase, getAllDocumentsForPrefix } from './pouchdb-utils';

@Injectable()
export class PreismeldestelleEffects {
    constructor(private actions$: Actions) { }

    @Effect()
    loadPreismeldestellen$ = this.actions$
        .ofType('PREISMELDESTELLEN_LOAD_ALL')
        .switchMap(() => getDatabase())
        .flatMap(db => db.allDocs(Object.assign({}, getAllDocumentsForPrefix('preismeldestelle'), { include_docs: true })))
        // .flatMap(db => db.allDocs({ ...getAllDocumentsForPrefix('preismeldestelle'), include_docs: true }))) // TODO: TS2.1
        .map(allDocs => ({ type: 'PREISMELDESTELLEN_LOAD_SUCCESS', payload: allDocs.rows.map(x => x.doc) }));
}
