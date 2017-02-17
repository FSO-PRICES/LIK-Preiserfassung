import { Component, EventEmitter } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';

import * as fromRoot from '../../reducers';
import { Models as P } from 'lik-shared';

PouchDB.plugin(pouchDbAuthentication);

@Component({
    selector: 'preismeldestelle',
    templateUrl: 'preismeldestelle.html'
})
export class PreismeldestellePage {
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);
    public currentPreismeldestelle$ = this.store.select(fromRoot.getCurrentPreismeldestelle).publishReplay(1).refCount();
    public selectPreismeldestelle$ = new EventEmitter<string>();
    public clearSelectedPreismeldestelle$ = new EventEmitter();
    public savePreismeldestelle$ = new EventEmitter();
    public updatePreismeldestelle$ = new EventEmitter<P.Erheber>();

    constructor(private formBuilder: FormBuilder, private store: Store<fromRoot.AppState>) {
        this.selectPreismeldestelle$
            .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDESTELLE', payload: x }));

        this.clearSelectedPreismeldestelle$
            .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDESTELLE', payload: null}));

        this.updatePreismeldestelle$
            .subscribe(x => store.dispatch({ type: 'UPDATE_CURRENT_PREISMELDESTELLE', payload: x }));

        this.savePreismeldestelle$
            .subscribe(x => store.dispatch({ type: 'SAVE_PREISMELDESTELLE' }));
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' });
    }
}
