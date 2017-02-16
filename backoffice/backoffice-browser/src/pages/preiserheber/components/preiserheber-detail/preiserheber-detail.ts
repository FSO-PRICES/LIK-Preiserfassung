import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';
import { Observable, ReplaySubject } from 'rxjs';
import { ReactiveComponent } from 'lik-common';


import * as M from '../../../../common-models';
import * as fromRoot from '../../../../reducers';
import { getPreiserhebers } from '../../../../reducers/index';
import { getCurrentPreiserheber, CurrentPreiserheber } from '../../../../reducers/preiserheber';

PouchDB.plugin(pouchDbAuthentication);

@Component({
    selector: 'preiserheber-detail',
    templateUrl: 'preiserheber-detail.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreiserheberDetailComponent extends ReactiveComponent implements OnChanges {
    @Input() preiserheber: M.Erheber;
    @Output("save")
    public save$ = new EventEmitter();
    @Output("clear")
    public clear$ = new EventEmitter();
    @Output("update")
    public update$ = new EventEmitter<M.Erheber>();

    public preiserheber$: Observable<M.Erheber>;
    public clearClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter<Event>();
    public formValueChanged$ = new EventEmitter<string>();

    public form: FormGroup;

    constructor(private formBuilder: FormBuilder, private store: Store<fromRoot.AppState>) {
        super();

        this.preiserheber$ = this.observePropertyCurrentValue<M.Erheber>('preiserheber');

        this.form = formBuilder.group({
            firstName: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
            surname: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
            personFunction: [null, Validators.required],
            languageCode: ['de', Validators.required],
            telephone: [null],
            email: [null]
        });

        const distinctPreiserheber$ = this.preiserheber$
            .filter(x => !!x)
            .distinctUntilKeyChanged('_id');

        distinctPreiserheber$
            .subscribe(erheber => {
                this.form.patchValue({
                    id: erheber._id,
                    firstName: erheber.firstName,
                    surname: erheber.surname,
                    personFunction: erheber.personFunction,
                    languageCode: erheber.languageCode,
                    telephone: erheber.telephone,
                    email: erheber.email
                });
            });

        this.formValueChanged$
            .subscribe(x => this.update$.emit(this.form.value));

        const canSave$ = this.saveClicked$
            .map(x => ({ isValid: this.form.valid }))
            .publishReplay(1).refCount();

        canSave$.filter(x => x.isValid)
            .publishReplay(1).refCount()
            .withLatestFrom(this.saveClicked$)
            .subscribe(x => this.save$.emit());
        
        this.clearClicked$.subscribe(x => this.clear$.emit());
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public isEditing() {
        return this.preiserheber$.map(x => !!x && !!x._id);
    }
}
