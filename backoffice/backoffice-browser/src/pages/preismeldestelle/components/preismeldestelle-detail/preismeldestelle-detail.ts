import {
    Component,
    EventEmitter,
    Input,
    Output,
    OnChanges,
    SimpleChange,
    ChangeDetectionStrategy,
    OnDestroy,
} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { range, assign } from 'lodash';

import {
    ReactiveComponent,
    Models as P,
    encodeErhebungsartFromForm,
    parseErhebungsarten,
    preismeldestelleId,
} from 'lik-shared';

import { CurrentPreismeldestelle } from '../../../../reducers/preismeldestelle';

@Component({
    selector: 'preismeldestelle-detail',
    templateUrl: 'preismeldestelle-detail.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldestelleDetailComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldestelle: P.Preismeldestelle;
    @Input() erhebungsregionen: string[];
    @Input() languages: P.Language[];
    @Input() preiserheber: P.Erheber;
    @Output('save') public save$: Observable<{ isValid: boolean }>;
    @Output('cancel') public cancelClicked$ = new EventEmitter<Event>();
    @Output('update') public update$: Observable<P.Preismeldestelle>;

    public preismeldestelle$: Observable<P.Preismeldestelle>;
    public languages$: Observable<P.Language[]>;
    public saveClicked$ = new EventEmitter<Event>();
    public pmsGeschlossenClicked$ = new EventEmitter();
    public erhebungsregionen$: Observable<string[]>;

    public showValidationHints$: Observable<boolean>;

    private subscriptions: Subscription[];

    public form: FormGroup;

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preismeldestelle$ = this.observePropertyCurrentValue<P.Preismeldestelle>('preismeldestelle');
        this.languages$ = this.observePropertyCurrentValue<P.Language[]>('languages');
        this.erhebungsregionen$ = this.observePropertyCurrentValue<string[]>('erhebungsregionen');

        this.form = formBuilder.group(
            {
                kontaktpersons: formBuilder.array(range(2).map(i => this.initKontaktpersonGroup())),
                name: [null, Validators.required],
                supplement: [null],
                street: [null, Validators.required],
                postcode: [null, Validators.required],
                town: [null, Validators.required],
                telephone: [null],
                email: [null],
                internetLink: [null],
                languageCode: [null, Validators.required],
                erhebungsregion: [null],
                erhebungsart: formBuilder.group({
                    tablet: [false],
                    telefon: [false],
                    email: [false],
                    internet: [false],
                    papierlisteVorOrt: [false],
                    papierlisteAbgegeben: [false],
                }),
                pmsGeschlossen: [null],
                erhebungsartComment: [null],
                zusatzInformationen: [null],
                active: [true],
            },
            { validator: this.formLevelValidationFactory() }
        );

        this.update$ = this.form.valueChanges
            .withLatestFrom(this.preismeldestelle$, (formValue, preismeldestelle) => ({ formValue, preismeldestelle }))
            .map(({ formValue, preismeldestelle }) => {
                return assign(
                    {},
                    formValue,
                    { _id: preismeldestelleId(preismeldestelle.pmsNummer) },
                    { erhebungsart: encodeErhebungsartFromForm(this.form.value.erhebungsart) }
                );
            });

        const distinctPreismeldestelle$ = this.preismeldestelle$.distinctUntilKeyChanged('_id');

        const canSave$ = this.saveClicked$
            .map(() => ({ isValid: this.form.valid }))
            .publishReplay(1)
            .refCount();

        this.save$ = canSave$
            .filter(x => x.isValid)
            .publishReplay(1)
            .refCount();

        this.showValidationHints$ = canSave$
            .distinctUntilChanged()
            .mapTo(true)
            .merge(distinctPreismeldestelle$.mapTo(false));

        this.subscriptions = [
            distinctPreismeldestelle$.subscribe((preismeldestelle: CurrentPreismeldestelle) => {
                this.form.markAsUntouched();
                this.form.markAsPristine();
                this.form.patchValue(
                    {
                        kontaktpersons: this.getKontaktPersonMapping(preismeldestelle.kontaktpersons),
                        name: preismeldestelle.name,
                        supplement: preismeldestelle.supplement,
                        street: preismeldestelle.street,
                        postcode: preismeldestelle.postcode,
                        town: preismeldestelle.town,
                        telephone: preismeldestelle.telephone,
                        email: preismeldestelle.email,
                        internetLink: preismeldestelle.internetLink,
                        languageCode: !!preismeldestelle.languageCode ? preismeldestelle.languageCode : '',
                        erhebungsregion: preismeldestelle.erhebungsregion,
                        erhebungsart: parseErhebungsarten(preismeldestelle.erhebungsart),
                        pmsGeschlossen: preismeldestelle.pmsGeschlossen,
                        erhebungsartComment: preismeldestelle.erhebungsartComment,
                        zusatzInformationen: preismeldestelle.zusatzInformationen,
                    },
                    { onlySelf: true, emitEvent: false }
                );
            }),

            this.pmsGeschlossenClicked$
                .mapTo(null)
                .merge(distinctPreismeldestelle$)
                .scan((pmsGeschlossen, p) => {
                    if (!!p) return p.pmsGeschlossen;
                    return pmsGeschlossen === this.form.value.pmsGeschlossen ? null : this.form.value.pmsGeschlossen;
                }, 0)
                .filter(pmsGeschlossen => !pmsGeschlossen)
                .subscribe(x => {
                    this.form.patchValue({ pmsGeschlossen: 0 });
                }),
        ];
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    private initKontaktpersonGroup() {
        return this.formBuilder.group({
            oid: [null],
            firstName: [null],
            surname: [null],
            personFunction: [null],
            telephone: [null],
            mobile: [null],
            fax: [null],
            email: [null],
            languageCode: [null],
        });
    }

    private getKontaktPersonMapping(kontaktpersons: P.KontaktPerson[]) {
        if (!kontaktpersons || kontaktpersons.length === 0)
            kontaktpersons = [<any>{ languageCode: '' }, { languageCode: '' }];
        return kontaktpersons.map(x => ({
            oid: x.oid,
            firstName: x.firstName,
            surname: x.surname,
            personFunction: x.personFunction,
            telephone: x.telephone,
            mobile: x.mobile,
            fax: x.fax,
            email: x.email,
            languageCode: x.languageCode !== null ? x.languageCode : '',
        }));
    }

    private formLevelValidationFactory() {
        return (group: FormGroup) => {
            const erhebungsart = group.get('erhebungsart') as FormGroup;
            if (
                !erhebungsart.get('tablet').value &&
                !erhebungsart.get('telefon').value &&
                !erhebungsart.get('email').value &&
                !erhebungsart.get('internet').value &&
                !erhebungsart.get('papierlisteVorOrt').value &&
                !erhebungsart.get('papierlisteAbgegeben').value
            ) {
                return { erhebungsart_required: true };
            }
        };
    }
}
