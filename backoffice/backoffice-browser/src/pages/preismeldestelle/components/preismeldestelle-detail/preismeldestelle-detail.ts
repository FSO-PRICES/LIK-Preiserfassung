import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { range, assign } from 'lodash';

import { ReactiveComponent, Models as P, encodeErhebungsartFromForm, parseErhebungsartForForm } from 'lik-shared';

import { CurrentPreismeldestelle } from '../../../../reducers/preismeldestelle';


@Component({
    selector: 'preismeldestelle-detail',
    templateUrl: 'preismeldestelle-detail.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldestelleDetailComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldestelle: P.Preismeldestelle;
    @Input() languages: P.Language[];
    @Output('save')
    public save$: Observable<{ isValid: boolean }>;
    @Output('cancel')
    public cancelClicked$ = new EventEmitter<Event>();
    @Output('update')
    public update$: Observable<P.Preismeldestelle>;

    public preismeldestelle$: Observable<P.Preismeldestelle>;
    public languages$: Observable<P.Language[]>;
    public saveClicked$ = new EventEmitter<Event>();

    public showValidationHints$: Observable<boolean>;

    private subscriptions: Subscription[];

    public form: FormGroup;

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preismeldestelle$ = this.observePropertyCurrentValue<P.Preismeldestelle>('preismeldestelle');
        this.languages$ = this.observePropertyCurrentValue<P.Language[]>('languages');

        this.form = formBuilder.group({
            kontaktpersons: formBuilder.array(range(2).map(i => this.initKontaktpersonGroup())),
            name: [null, Validators.required],
            supplement: [null],
            street: [null, Validators.required],
            postcode: [null, Validators.required],
            town: [null, Validators.required],
            telephone: [null],
            email: [null],
            languageCode: [null, Validators.required],
            erhebungsart_tablet: [false],
            erhebungsart_telefon: [false],
            erhebungsart_email: [false],
            erhebungsart_internet: [false],
            erhebungsart_papierlisteVorOrt: [false],
            erhebungsart_papierlisteAbgegeben: [false],
            erhebungshaeufigkeit: [{ value: null }],
            erhebungsartComment: [null],
            zusatzInformationen: [null],
            active: [true],
        }, { validator: this.formLevelValidationFactory() });

        this.update$ = this.form.valueChanges
            .withLatestFrom(this.preismeldestelle$, (formValue, preismeldestelle) => ({ formValue, preismeldestelle }))
            .map(({ formValue, preismeldestelle }) => {
                return assign({}, formValue, { _id: `pms/${preismeldestelle.pmsNummer}` }, { erhebungsart: encodeErhebungsartFromForm(this.form.value) });
            });

        const distinctPreismeldestelle$ = this.preismeldestelle$
            .distinctUntilKeyChanged('_id');

        const canSave$ = this.saveClicked$
            .map(() => ({ isValid: this.form.valid }))
            .publishReplay(1).refCount();

        this.save$ = canSave$
            .do(() => console.log(this.form))
            .filter(x => x.isValid)
            .publishReplay(1).refCount();

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true)
            .merge(distinctPreismeldestelle$.mapTo(false));

        this.subscriptions = [
            distinctPreismeldestelle$
                .subscribe((preismeldestelle: CurrentPreismeldestelle) => {
                    this.form.markAsUntouched();
                    this.form.markAsPristine();
                    this.form.patchValue({
                        kontaktpersons: this.getKontaktPersonMapping(preismeldestelle.kontaktpersons),
                        name: preismeldestelle.name,
                        supplement: preismeldestelle.supplement,
                        street: preismeldestelle.street,
                        postcode: preismeldestelle.postcode,
                        town: preismeldestelle.town,
                        telephone: preismeldestelle.telephone,
                        email: preismeldestelle.email,
                        languageCode: !!preismeldestelle.languageCode ? preismeldestelle.languageCode : '',
                        ...parseErhebungsartForForm(preismeldestelle.erhebungsart),
                        pmsGeschlossen: preismeldestelle.pmsGeschlossen,
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
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }

    private initKontaktpersonGroup() {
        return this.formBuilder.group({
            firstName: [null],
            surname: [null],
            personFunction: [null],
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

    private formLevelValidationFactory() {
        return (group: FormGroup) => {
            if (!group.get('erhebungsart_tablet').value
                && !group.get('erhebungsart_telefon').value
                && !group.get('erhebungsart_email').value
                && !group.get('erhebungsart_internet').value
                && !group.get('erhebungsart_papierlisteVorOrt').value
                && !group.get('erhebungsart_papierlisteAbgegeben').value) {
                return { 'erhebungsart_required': true };
            }
        };
    }

}
