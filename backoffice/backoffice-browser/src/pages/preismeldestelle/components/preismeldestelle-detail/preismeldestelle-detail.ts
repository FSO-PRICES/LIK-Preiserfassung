import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as _ from 'lodash';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';
import { Observable } from 'rxjs';
import { ReactiveComponent, Models as P } from 'lik-shared';


import * as M from '../../../../common-models';

PouchDB.plugin(pouchDbAuthentication);

@Component({
    selector: 'preismeldestelle-detail',
    templateUrl: 'preismeldestelle-detail.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldestelleDetailComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldestelle: P.AdvancedPreismeldestelle;
    @Output('save')
    public save$ = new EventEmitter();
    @Output('clear')
    public clear$ = new EventEmitter();
    @Output('update')
    public update$ = new EventEmitter<P.AdvancedPreismeldestelle>();

    public preismeldestelle$: Observable<P.AdvancedPreismeldestelle>;
    public updateSettings$ = new EventEmitter<P.AdvancedPresimeldestelleProperties>();
    public settingsValidity$ = new EventEmitter<boolean>();
    public clearClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter<Event>();

    public form: FormGroup;

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preismeldestelle$ = this.observePropertyCurrentValue<P.AdvancedPreismeldestelle>('preismeldestelle');

        this.form = formBuilder.group({
            pmsNummer: [null, Validators.compose([Validators.required, Validators.pattern('[0-9]+')])],
            name: [null],
            regionId: [null],
            supplement: [null, Validators.required],
            street: [null],
            postcode: [null],
            town: [null],
            active: [true]
        });

        this.form.valueChanges
            .subscribe(x => this.update$.emit(this.form.value));

        const distinctPreiserheber$ = this.preismeldestelle$
            .filter(x => !!x);

        distinctPreiserheber$.startWith((<P.AdvancedPreismeldestelle>{}))
            .subscribe(preismeldestelle => {
                this.form.patchValue(<P.AdvancedPreismeldestelle>{
                    pmsNummer: preismeldestelle.pmsNummer,
                    name: preismeldestelle.name,
                    supplement: preismeldestelle.supplement,
                    street: preismeldestelle.street,
                    postcode: preismeldestelle.postcode,
                    town: preismeldestelle.town,
                    telephone: preismeldestelle.town,
                    email: preismeldestelle.email,
                    languageCode: preismeldestelle.languageCode,
                });
            });

        const canSave$ = this.saveClicked$
            .combineLatest(this.settingsValidity$, (_, settingsValid: boolean) => ({ isValid: this.form.valid && settingsValid }))
            .publishReplay(1).refCount();

        canSave$.filter(x => x.isValid)
            .publishReplay(1).refCount()
            .withLatestFrom(this.saveClicked$)
            .subscribe(x => this.save$.emit());

        this.clearClicked$.subscribe(x => this.clear$.emit());

        this.updateSettings$.subscribe(x => console.log('settings have changed:', x));
        this.settingsValidity$.subscribe(x => console.log('settings have updated validity:', x));
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public isEditing() {
        return this.preismeldestelle$.map(x => !!x && !!x._id);
    }
}
