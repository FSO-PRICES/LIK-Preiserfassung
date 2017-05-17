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
            pmsNummer: [null, Validators.compose([Validators.required, Validators.pattern('[0-9]+')])],
            name: [null],
            regionId: [null],
            languageCode: [null],
            supplement: [null],
            street: [null],
            postcode: [null],
            town: [null],
            active: [true],
            erhebungsart: [{ value: null, disabled: true }],
            erhebungshaeufigkeit: [{ value: null, disabled: true }],
            erhebungsartComment: [{ value: null, disabled: true }],
            additionalInformation: [{ value: null, disabled: true }],
        });

        this.update$ = this.form.valueChanges
            .map(() => {
                const preismeldestelle = this.form.value;
                return assign({}, preismeldestelle, { _id: `pms/${preismeldestelle.pmsNummer}` });
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
                        erhebungsregion: preismeldestelle.erhebungsregion,
                        erhebungsart: preismeldestelle.erhebungsart,
                        erhebungshaeufigkeit: preismeldestelle.erhebungshaeufigkeit,
                        erhebungsartComment: preismeldestelle.erhebungsartComment,
                        pmsNummer: preismeldestelle.pmsNummer,
                        name: preismeldestelle.name,
                        supplement: preismeldestelle.supplement,
                        street: preismeldestelle.street,
                        postcode: preismeldestelle.postcode,
                        town: preismeldestelle.town,
                        telephone: preismeldestelle.town,
                        email: preismeldestelle.email,
                        languageCode: preismeldestelle.languageCode !== null ? preismeldestelle.languageCode : '',
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
            languageCode: [null],
            telephone: [null],
            mobile: [null],
            fax: [null],
            email: [null]
        });
    }

    private getKontaktPersonMapping(kontaktpersons: P.KontaktPerson[]) {
        if (!kontaktpersons || kontaktpersons.length === 0) kontaktpersons = [<any>{ languageCode: '' }, { languageCode: '' }];
        return kontaktpersons.map(x => ({
            firstName: x.firstName,
            surname: x.surname,
            personFunction: x.personFunction,
            languageCode: x.languageCode !== null ? x.languageCode : '',
            telephone: x.telephone,
            mobile: x.mobile,
            fax: x.fax,
            email: x.email
        }));
    }
}
