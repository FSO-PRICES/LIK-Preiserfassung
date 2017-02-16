import { Component, EventEmitter, Output, SimpleChange, Input, OnChanges } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';
import { Observable, ReplaySubject } from 'rxjs';
import { ReactiveComponent } from 'lik-common';

import * as M from '../../../../common-models';
import * as fromRoot from '../../../../reducers';
import { getPreiserhebers } from '../../reducers/index';
import { getCurrentPreiserheber, CurrentPreiserheber } from '../../../../reducers/preiserheber';

PouchDB.plugin(pouchDbAuthentication);

@Component({
    selector: 'preiserheber-list',
    templateUrl: 'preiserheber-list.html'
})
export class PreiserheberListComponent extends ReactiveComponent implements OnChanges {
    @Input() list: M.Erheber[];
    @Input() current: M.Erheber;
    @Output("selected")
    public selected$ = new EventEmitter<string>();

    public preiserhebers$: Observable<M.Erheber[]>;
    public current$: Observable<M.Erheber>;
    public selectPreiserheber$ = new EventEmitter<M.Erheber>();

    constructor(private formBuilder: FormBuilder, private store: Store<fromRoot.AppState>) {
        super();

        this.preiserhebers$ = this.observePropertyCurrentValue<M.Erheber[]>('list');
        this.current$ = this.observePropertyCurrentValue<M.Erheber>('current');

        const requestSelectPreiserheber$ = this.selectPreiserheber$
            .withLatestFrom(this.current$.startWith(null), (selectedPreiserheber: M.Erheber, currentPreiserheber: M.CurrentPreiserheber) => ({
                selectedPreiserheber,
                currentPreiserheber,
                isCurrentModified: !!currentPreiserheber && currentPreiserheber.isModified
            }));

        requestSelectPreiserheber$
            .filter(x => !x.isCurrentModified)
            .subscribe(x => this.selected$.emit(x.selectedPreiserheber._id));
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
