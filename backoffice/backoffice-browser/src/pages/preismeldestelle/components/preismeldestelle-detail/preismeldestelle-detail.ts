import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { range, assign } from 'lodash';

import { ReactiveComponent, Models as P } from 'lik-shared';

import { CurrentPreismeldestelle } from '../../../../reducers/preismeldestelle';


@Component({
    selector: 'preismeldestelle-detail',
    templateUrl: 'preismeldestelle-detail.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldestelleDetailComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldestelle: P.Preismeldestelle;
    @Input() languages: P.Language[];
    @Input() regionen: P.Region[];
    @Output('save')
    public save$: Observable<{ isValid: boolean }>;
    @Output('cancel')
    public cancelClicked$ = new EventEmitter<Event>();
    @Output('update')
    public update$: Observable<P.Preismeldestelle>;

    public preismeldestelle$: Observable<P.Preismeldestelle>;
    public languages$: Observable<P.Language[]>;
    public regionen$: Observable<P.Region[]>;
    public saveClicked$ = new EventEmitter<Event>();

    public showValidationHints$: Observable<boolean>;

    private subscriptions: Subscription[];

    public form: FormGroup;

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preismeldestelle$ = this.observePropertyCurrentValue<P.Preismeldestelle>('preismeldestelle');
        this.languages$ = this.observePropertyCurrentValue<P.Language[]>('languages');
        this.regionen$ = this.observePropertyCurrentValue<P.Region[]>('regionen');

        this.form = formBuilder.group({
            kontaktpersons: formBuilder.array(range(2).map(i => this.initKontaktpersonGroup({ required: i === 0 }))),
            // pmsNummer: [null, Validators.compose([Validators.required, Validators.pattern('[0-9]+')])],
            name: [null, Validators.required],
            supplement: [null],
            street: [null, Validators.required],
            postcode: [null, Validators.required],
            town: [null, Validators.required],
            telephone: [null],
            email: [null],
            languageCode: [null, Validators.required],
            erhebungsregion: [null, Validators.required],
            erhebungsart: [{ value: null }, Validators.required],
            erhebungshaeufigkeit: [{ value: null }],
            erhebungsartComment: [{ value: null }],
            zusatzInformationen: [null],
            active: [true],
        });

        this.update$ = this.form.valueChanges
            .withLatestFrom(this.preismeldestelle$, (formValue, preismeldestelle) => ({ formValue, preismeldestelle }))
            .map(({ formValue, preismeldestelle }) => {
                return assign({}, formValue, { _id: `pms/${preismeldestelle.pmsNummer}` });
            });

        const distinctPreismeldestelle$ = this.preismeldestelle$
            .distinctUntilKeyChanged('_id');

        const canSave$ = this.saveClicked$
            .map(() => ({ isValid: this.form.valid }))
            .publishReplay(1).refCount();

        this.save$ = canSave$.filter(x => x.isValid)
            .publishReplay(1).refCount();

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true)
            .merge(distinctPreismeldestelle$.mapTo(false));

        this.subscriptions = [
            distinctPreismeldestelle$
                .subscribe((preismeldestelle: CurrentPreismeldestelle) => {
                    this.form.markAsUntouched();
                    this.form.markAsPristine();
                    this.form.patchValue(<P.Preismeldestelle>{
                        kontaktpersons: this.getKontaktPersonMapping(preismeldestelle.kontaktpersons),
                        // pmsNummer: preismeldestelle.pmsNummer,
                        name: preismeldestelle.name,
                        supplement: preismeldestelle.supplement,
                        street: preismeldestelle.street,
                        postcode: preismeldestelle.postcode,
                        town: preismeldestelle.town,
                        telephone: preismeldestelle.telephone,
                        email: preismeldestelle.email,
                        languageCode: !!preismeldestelle.languageCode ? preismeldestelle.languageCode : '',
                        erhebungsregion: !!preismeldestelle.erhebungsregion ? preismeldestelle.erhebungsregion : '',
                        erhebungsart: preismeldestelle.erhebungsart,
                        erhebungshaeufigkeit: preismeldestelle.erhebungshaeufigkeit,
                        erhebungsartComment: preismeldestelle.erhebungsartComment,
                        zusatzInformationen: preismeldestelle.zusatzInformationen,
                        active: preismeldestelle.active
                    }, { onlySelf: true, emitEvent: false });
                })
        ];
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public ngOnDestroy() {
        if (!this.subscriptions || this.subscriptions.length === 0) return;
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }

    private initKontaktpersonGroup({ required }) {
        const r = (validator) => required ? validator : null;
        return this.formBuilder.group({
            firstName: [null, r(Validators.compose([Validators.required, Validators.minLength(1)]))],
            surname: [null, r(Validators.compose([Validators.required, Validators.minLength(1)]))],
            personFunction: [null, r(Validators.required)],
            telephone: [null],
            mobile: [null],
            fax: [null],
            email: [null],
            languageCode: [null]
        });
    }

    private getKontaktPersonMapping(kontaktpersons: P.KontaktPerson[]) {
        if (!kontaktpersons || kontaktpersons.length === 0) kontaktpersons = [<any>{ languageCode: '' }, { languageCode: '' }];
        return kontaktpersons.map(x => ({
            firstName: x.firstName,
            surname: x.surname,
            personFunction: x.personFunction,
            telephone: x.telephone,
            mobile: x.mobile,
            fax: x.fax,
            email: x.email,
            languageCode: x.languageCode !== null ? x.languageCode : ''
        }));
    }
}
