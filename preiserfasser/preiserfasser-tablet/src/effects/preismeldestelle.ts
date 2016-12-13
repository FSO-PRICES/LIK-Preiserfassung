import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
// import * as preisemeldestelle from '../actions/preisemeldestelle';

import { getDatabase, getAllDocumentsForPrefix } from './pouchdb';

@Injectable()
export class PreismeldestelleEffects {
    constructor(private actions$: Actions) {
    }

    @Effect()
    loadPreismeldestellen$ = this.actions$
        .ofType('PREISEMELDESTELLE_LOAD_ALL')
        .switchMap(() => getDatabase())
        .flatMap(db => db.allDocs(getAllDocumentsForPrefix('preisemeldestelle')))
        .map(payload => ({ type: 'PREISEMELDESTELLE_LOAD_SUCCESS', payload }));
}
