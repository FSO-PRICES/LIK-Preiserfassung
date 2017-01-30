import { Injectable } from '@angular/core';
import { Observable, ConnectableObservable } from 'rxjs';
import { Effect, Actions } from '@ngrx/effects';

import { getDatabase, getAllDocumentsForPrefix } from './pouchdb-utils';

@Injectable()
export class PreismeldungenEffects {
    constructor(private actions$: Actions) { }

    @Effect()
    loadPreismeldungen$ = this.actions$
        .ofType('PREISMELDUNGEN_LOAD_FOR_PMS')
        .switchMap(({ payload }) => getDatabase().then(db => ({ db, pmsKey: payload })))
        .flatMap(x => x.db.allDocs(Object.assign({}, getAllDocumentsForPrefix(`preismeldung/${x.pmsKey}`), { include_docs: true })).then(docs => ({ db: x.db, preismeldungen: docs.rows.map(y => y.doc) })))
        .flatMap(x => x.db.get('warenkorb').then((warenkorbDoc: any) => { // TODO: add types for warenkorb
            return x.preismeldungen.map(preismeldung => Object.assign({}, preismeldung, { warenkorbPosition: warenkorbDoc.products.find(p => p.gliederungspositionsnummer === (preismeldung as any).erhebungspositionsnummer) }))
        }))
        .map(docs => ({ type: 'PREISMELDUNGEN_LOAD_SUCCESS', payload: docs }));
}
