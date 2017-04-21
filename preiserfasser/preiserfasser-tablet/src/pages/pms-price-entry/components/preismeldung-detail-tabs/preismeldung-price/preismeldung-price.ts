import { Component, EventEmitter, Input, Output, SimpleChange, OnChanges, ChangeDetectionStrategy, OnDestroy, Inject } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from 'ng2-translate';
import { keys, assign } from 'lodash';
import * as format from 'format-number';

import { ReactiveComponent, formatPercentageChange, maxMinNumberValidatorFactory, PefDialogService, PefDialogYesNoComponent } from 'lik-shared';

import * as P from '../../../../../common-models';

import { DialogValidationErrorsComponent } from './dialog-validation-errors/dialog-validation-errors';

interface PercentageValues {
    lastPeriodToThisPeriod: string;
}

@Component({
    selector: 'preismeldung-price',
    templateUrl: 'preismeldung-price.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldungPriceComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() priceCountStatus: P.PriceCountStatus;
    @Input() requestPreismeldungSave: { saveAction: P.SavePreismeldungPricePayloadType };
    @Input() requestPreismeldungQuickEqual: string;
    @Output('preismeldungPricePayload') preismeldungPricePayload$: Observable<P.PreismeldungPricePayload>;
    @Output('save') save$: Observable<{ saveAction: P.SavePreismeldungPricePayloadType }>;
    @Output('duplicatePreismeldung') duplicatePreismeldung$ = new EventEmitter();

    public preismeldung$: Observable<P.PreismeldungBag>;
    public requestPreismeldungSave$: Observable<{saveAction: P.SavePreismeldungPricePayloadType}>;
    public requestPreismeldungQuickEqual$: Observable<string>;
    public codeListType$: Observable<string>;

    public changeBearbeitungscode$ = new EventEmitter<P.Models.Bearbeitungscode>();
    public preisAndMengeDisabled$: Observable<boolean>;
    public showVPArtikelNeu$: Observable<boolean>;
    public selectedProcessingCode$ = new EventEmitter<any>();

    public preisChanged$ = new EventEmitter<string>();
    public preisCurrentValue$: Observable<{ value: string }>;
    public mengeChanged$ = new EventEmitter<string>();
    public createInvalidObservableFor: (controlName: string) => Observable<boolean>;

    public preisVPNormalNeuerArtikelChanged$ = new EventEmitter<string>();
    public preisVPNormalNeuerArtikelCurrentValue$: Observable<{ value: string }>;
    public mengeVPNormalNeuerArtikelChanged$ = new EventEmitter<string>();

    public toggleAktion$ = new EventEmitter();
    public showSaveWarning$: Observable<boolean>;
    public percentageValues$: Observable<PercentageValues>;
    public attemptSave$ = new EventEmitter();
    public showValidationHints$: Observable<boolean>;
    public applyUnitQuickEqual$ = new EventEmitter();
    public applyUnitQuickEqualVP$ = new EventEmitter();
    public thisPeriodFehlendePreiseR$: Observable<string>;

    public priceNumberFormattingOptions = { padRight: 2, truncate: 4, integerSeparator: '' };
    public mengeNumberFormattingOptions = { padRight: 0, truncate: 3, integerSeparator: '' };

    public currentPeriodHeading$: Observable<string>;

    private preiseFormatFn = format(this.priceNumberFormattingOptions);
    private mengeFormatFn = format(this.mengeNumberFormattingOptions);

    priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');

    form: FormGroup;

    private subscriptions: Subscription[] = [];

    constructor(formBuilder: FormBuilder, pefDialogService: PefDialogService, translateService: TranslateService, @Inject('windowObject') public window: Window) {
        super();

        this.preisChanged$.subscribe(x => { this.form.patchValue({ preis: `${this.preiseFormatFn(x)}` }); });
        this.mengeChanged$.subscribe(x => { this.form.patchValue({ menge: `${this.mengeFormatFn(x)}` }); });
        this.preisVPNormalNeuerArtikelChanged$.subscribe(x => { this.form.patchValue({ preisVPNormalNeuerArtikel: `${this.preiseFormatFn(x)}` }); });
        this.mengeVPNormalNeuerArtikelChanged$.subscribe(x => { this.form.patchValue({ mengeVPNormalNeuerArtikel: `${this.mengeFormatFn(x)}` }); });

        this.form = formBuilder.group({
            pmId: [''],
            preis: ['', Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 4 })])],
            menge: ['', Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 99999.99, { padRight: 2, truncate: 3 })])],
            preisVPNormalNeuerArtikel: [''],
            mengeVPNormalNeuerArtikel: [''],
            aktion: [false],
            bearbeitungscode: [100, Validators.required],
            artikelnummer: [null],
            artikeltext: [null, Validators.required]
        }, { validator: this.formLevelValidationFactory() });

        this.preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
        this.requestPreismeldungSave$ = this.observePropertyCurrentValue<{ saveAction: P.SavePreismeldungPricePayloadType }>('requestPreismeldungSave').filter(x => !!x);
        this.requestPreismeldungQuickEqual$ = this.observePropertyCurrentValue<string>('requestPreismeldungQuickEqual').filter(x => !!x);

        const distinctPreismeldung$ = this.preismeldung$
            .filter(x => !!x)
            .distinctUntilKeyChanged('pmId')
            .publishReplay(1).refCount();

        this.preisCurrentValue$ = this.form.valueChanges.map(() => this.form.value.preis)
            .merge(distinctPreismeldung$.map(x => x.preismeldung.preis))
            .map(x => ({ value: `${this.preiseFormatFn(x)}` }));

        this.preisVPNormalNeuerArtikelCurrentValue$ = this.form.valueChanges.map(() => this.form.value.preisVPNormalNeuerArtikel)
            .merge(distinctPreismeldung$.map(x => x.preismeldung.preisVPNormalNeuerArtikel))
            .map(x => ({ value: `${this.preiseFormatFn(x)}` }));

        this.subscriptions.push(
            distinctPreismeldung$
                .subscribe(preismeldung => {
                    this.form.reset({
                        pmId: preismeldung.pmId,
                        preis: preismeldung.preismeldung.preis,
                        menge: preismeldung.preismeldung.menge,
                        aktion: preismeldung.preismeldung.aktion,
                        preisVPNormalNeuerArtikel: preismeldung.preismeldung.preisVPNormalNeuerArtikel,
                        mengeVPNormalNeuerArtikel: preismeldung.preismeldung.mengeVPNormalNeuerArtikel,
                        bearbeitungscode: preismeldung.preismeldung.bearbeitungscode,
                        artikelnummer: preismeldung.preismeldung.artikelnummer,
                        artikeltext: preismeldung.preismeldung.artikeltext
                    });
                })
        );

        this.subscriptions.push(
            this.requestPreismeldungQuickEqual$.withLatestFrom(distinctPreismeldung$, (_, currentPm: P.CurrentPreismeldungBag) => currentPm)
                .subscribe(currentPm => {
                    this.form.patchValue({
                        preis: `${currentPm.refPreismeldung ? this.preiseFormatFn(currentPm.refPreismeldung.preis) : ''}`,
                        menge: `${currentPm.refPreismeldung ? currentPm.refPreismeldung.menge : currentPm.refPreismeldung.menge}`,
                        aktion: currentPm.refPreismeldung.aktion
                    });
                })
        );

        this.subscriptions.push(
            this.applyUnitQuickEqual$.withLatestFrom(distinctPreismeldung$, (_, preismeldung: P.CurrentPreismeldungBag) => preismeldung)
                .subscribe(preismeldung => {
                    this.form.patchValue({
                        menge: `${preismeldung.refPreismeldung ? preismeldung.refPreismeldung.menge : preismeldung.warenkorbPosition.standardmenge}`,
                    });
                })
        );

        this.subscriptions.push(
            this.applyUnitQuickEqualVP$.withLatestFrom(distinctPreismeldung$, (_, preismeldung: P.CurrentPreismeldungBag) => preismeldung)
                .subscribe(preismeldung => {
                    this.form.patchValue({
                        mengeVPNormalNeuerArtikel: `${preismeldung.refPreismeldung ? preismeldung.refPreismeldung.menge : preismeldung.warenkorbPosition.standardmenge}`,
                    });
                })
        );

        this.subscriptions.push(
            this.toggleAktion$
                .subscribe(() => {
                    this.form.patchValue({
                        aktion: !this.form.value.aktion
                    });
                })
        );

        this.codeListType$ = distinctPreismeldung$
            .map(x => x.preismeldung.bearbeitungscode === 2 || x.preismeldung.bearbeitungscode === 3 ? 'NEW_PM' : 'STANDARD');

        this.preismeldungPricePayload$ = this.form.valueChanges
            .map(() => ({
                preis: this.form.value.preis,
                menge: this.form.value.menge,
                aktion: this.form.value.aktion,
                preisVPNormalNeuerArtikel: this.form.value.preisVPNormalNeuerArtikel,
                mengeVPNormalNeuerArtikel: this.form.value.mengeVPNormalNeuerArtikel,
                bearbeitungscode: this.form.value.bearbeitungscode,
                artikelnummer: this.form.value.artikelnummer,
                artikeltext: this.form.value.artikeltext
            }));

        const bearbeitungscodeChanged$ = this.changeBearbeitungscode$
            .merge(distinctPreismeldung$.map(x => x.preismeldung.bearbeitungscode))
            .publishReplay(1).refCount();

        this.preisAndMengeDisabled$ = bearbeitungscodeChanged$
            .map(x => this.calcPreisAndMengeDisabled(x));

        this.showVPArtikelNeu$ = bearbeitungscodeChanged$
            .map(x => x === 7 || x === 2)
            .publishReplay(1).refCount();

        this.thisPeriodFehlendePreiseR$ = bearbeitungscodeChanged$
            .withLatestFrom(distinctPreismeldung$, (bearbeitungscode: P.Models.Bearbeitungscode, bag: P.PreismeldungBag) => {
                if (bearbeitungscode !== 101) return '';
                return bag.refPreismeldung.fehlendePreiseR + 'R';
            });

        this.subscriptions.push(
            this.showVPArtikelNeu$
                .filter(x => !x && this.form.dirty)
                .subscribe(() => {
                    this.form.patchValue({
                        preisVPNormalNeuerArtikel: '',
                        mengeVPNormalNeuerArtikel: ''
                    });
                })
        );

        this.subscriptions.push(
            this.preisAndMengeDisabled$
                .filter(x => x && this.form.dirty)
                .withLatestFrom(distinctPreismeldung$.map(x => x.refPreismeldung), (_, refPreismeldung) => refPreismeldung)
                .subscribe(refPreismeldung => {
                    this.form.patchValue({
                        preis: `${this.preiseFormatFn(refPreismeldung.preis)}`,
                        menge: `${refPreismeldung.menge}`,
                        aktion: refPreismeldung.aktion
                    });
                })
        );

        this.subscriptions.push(
            this.preisAndMengeDisabled$
                .distinctUntilChanged()
                .filter(x => !x && this.form.dirty)
                .subscribe(() => {
                    this.form.patchValue({
                        preis: '',
                        menge: '',
                        aktion: false
                    });
                })
        );

        const canSave$ = this.attemptSave$.mapTo('JUST_SAVE').merge(this.requestPreismeldungSave$)
            .map(x => ({ saveAction: x, isValid: this.form.valid }))
            .publishReplay(1).refCount();

        const save$ = canSave$.filter(x => x.isValid)
            .map(x => x.saveAction)
            .flatMap(saveAction => Observable.defer(() =>
                distinctPreismeldung$.take(1)
                    .flatMap(bag => {
                        if ([1, 7].some(code => code === this.form.value.bearbeitungscode) && bag.refPreismeldung.artikeltext === this.form.value.artikeltext && bag.refPreismeldung.artikelnummer === this.form.value.artikelnummer) {
                            return pefDialogService.displayDialog(PefDialogYesNoComponent, translateService.instant('dialogText_unchangedPmText'), false).map(res => res.data);
                        }
                        if (this.form.value.bearbeitungscode === 101 && /^R$/.exec(bag.refPreismeldung.fehlendePreiseR) && bag.refPreismeldung.fehlendePreiseR.length >= 1) {
                            return pefDialogService.displayDialog(PefDialogYesNoComponent, translateService.instant('dialogText_rrr-message-mit-aufforderung-zu-produktersatz'), false)
                                .map(res => res.data)
                                // TODO write bermerkung, see issue #27
                                .map(() => 'YES');
                        }
                        return Observable.of('YES');
                    })
                    // TODO: change from yes to close or something ....
                    .filter(y => y === 'YES')
            ).map(() => saveAction));

        this.save$ = save$.withLatestFrom(this.preismeldungPricePayload$, this.priceCountStatus$, distinctPreismeldung$, (saveAction, preismeldungPricePayload, priceCountStatus, distinctPreismeldung) => ({ saveAction, preismeldungPricePayload, priceCountStatus, distinctPreismeldung }))
            .flatMap(x => {
                if (x.preismeldungPricePayload.bearbeitungscode === 0 && x.distinctPreismeldung.preismeldung.bearbeitungscode !== 0) {
                    const params = {
                        numActivePrices: x.priceCountStatus.numActivePrices - 1,
                        anzahlPreiseProPMS: x.priceCountStatus.anzahlPreiseProPMS
                    };
                    return pefDialogService.displayDialog(PefDialogYesNoComponent, translateService.instant('dialogText_aufforderung_ersatzsuche', params), false).map(res => res.data === 'YES' ? { saveAction: 'SAVE_AND_DUPLICATE_PREISMELDUNG' } : x.saveAction);
                }
                return Observable.of(x.saveAction);
            });

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true)
            .merge(distinctPreismeldung$.mapTo(false));

        this.subscriptions.push(
            canSave$
                .filter(x => !x.isValid)
                .map(() =>
                    keys(this.form.controls)
                        .filter(x => !!this.form.controls[x].errors)
                        .map(controlName => {
                            const control = this.form.controls[controlName];
                            const errorKey = keys(control.errors)[0];
                            const errorParams = assign({}, control.errors[errorKey], { controlName: translateService.instant(`control_${controlName}`) });
                            return translateService.instant(`validation_formatted_${errorKey}`, errorParams);
                        })
                )
                .flatMap(errorMessages => pefDialogService.displayDialog(DialogValidationErrorsComponent, errorMessages, true))
                .subscribe()
        );

        this.currentPeriodHeading$ = this.changeBearbeitungscode$.merge(distinctPreismeldung$.map(x => x.preismeldung.bearbeitungscode))
            .map(x => x === 7 || x === 2 || x === 3 ? 'heading_artikel-neu' : 'heading_artikel');

        const showInvalid$ = this.form.valueChanges.merge(this.attemptSave$).publishReplay(1).refCount();
        this.createInvalidObservableFor = (controlName: string) => showInvalid$.map(() => !!this.form.controls[controlName].errors);
    }

    calcPreisAndMengeDisabled(bearbeitungscode: P.Models.Bearbeitungscode) {
        return [0, 44, 101].some(x => x === bearbeitungscode);
    }

    formatPercentageChange = percentageChange => formatPercentageChange(percentageChange, 1);

    formatFehlendePreiseR(fehlendePreiseR: string) {
        if (!/.^R*$/.exec(fehlendePreiseR)) return fehlendePreiseR;
        return fehlendePreiseR.length >= 4 ? `R${fehlendePreiseR.length}` : fehlendePreiseR;
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    formLevelValidationFactory() {
        return (group: FormGroup) => {
            const bearbeitungscode = group.get('bearbeitungscode');
            if (!![2, 7].some(x => x === bearbeitungscode.value)) {
                const preisVPNormalNeuerArtikel = group.get('preisVPNormalNeuerArtikel');
                preisVPNormalNeuerArtikel.setErrors(Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 4 })])(preisVPNormalNeuerArtikel));
                const mengeVPNormalNeuerArtikel = group.get('mengeVPNormalNeuerArtikel');
                mengeVPNormalNeuerArtikel.setErrors(Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 999999.99, { padRight: 2, truncate: 2 })])(mengeVPNormalNeuerArtikel));
            }
        };
    }
}
