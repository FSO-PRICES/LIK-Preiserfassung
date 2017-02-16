import { Component, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';
import { Observable, ReplaySubject } from 'rxjs';

import * as M from '../../common-models';
import * as fromRoot from '../../reducers';
import { getPreiserhebers } from '../../reducers/index';
import { getCurrentPreiserheber, CurrentPreiserheber } from '../../reducers/preiserheber';

PouchDB.plugin(pouchDbAuthentication);

@Component({
    selector: 'preiserheber',
    templateUrl: 'preiserheber.html'
})
export class PreiserheberPage {
    public preiserhebers$ = this.store.select(fromRoot.getPreiserhebers);
    public currentPreiserheber$ = this.store.select(fromRoot.getCurrentPreiserheber).publishReplay(1).refCount();
    public selectPreiserheber$ = new EventEmitter<string>();
    public clearSelectedPreiserheber$ = new EventEmitter();
    public savePreiserheber$ = new EventEmitter();
    public updatePreiserheber$ = new EventEmitter<M.Erheber>();

    constructor(private formBuilder: FormBuilder, private store: Store<fromRoot.AppState>) {
        this.selectPreiserheber$
            .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISERHEBER', payload: x }));

        this.clearSelectedPreiserheber$
            .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISERHEBER', payload: null}))

        this.updatePreiserheber$
            .subscribe(x => store.dispatch({ type: 'UPDATE_CURRENT_PREISERHEBER', payload: x }))

        this.savePreiserheber$
            .subscribe(x => store.dispatch({ type: 'SAVE_PREISERHEBER' }));
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'PREISERHEBER_LOAD' });
    }
}
