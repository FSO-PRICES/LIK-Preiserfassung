import { Component, EventEmitter, Input, Output, SimpleChange, OnChanges, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
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
    @Input() requestPreismeldungSave: string;
    @Input() requestPreismeldungQuickEqual: string;
    @Output('preismeldungPricePayload') preismeldungPricePayload$: Observable<P.PreismeldungPricePayload>;
    @Output('save') save$: Observable<{ saveAction: P.SavePreismeldungPricePayloadType }>;
    @Output('duplicatePreismeldung') duplicatePreismeldung$ = new EventEmitter();

    public preismeldung$: Observable<P.PreismeldungBag>;
    public requestPreismeldungSave$: Observable<string>;
    public requestPreismeldungQuickEqual$: Observable<string>;
    public codeListType$: Observable<string>;

    public changeBearbeitungscode$ = new EventEmitter<P.Models.Bearbeitungscode>();
    public preisAndMengeDisabled$: Observable<boolean>;
    public showVPArtikelNeu$: Observable<boolean>;
    public selectedProcessingCode$ = new EventEmitter<any>();

    public preisChanged$ = new EventEmitter<string>();
    public preisInvalid$: Observable<boolean>;
    public preisCurrentValue$: Observable<{ value: string }>;
    public mengeChanged$ = new EventEmitter<string>();
    public mengeInvalid$: Observable<boolean>;

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

    public priceNumberFormattingOptions = { padRight: 2, truncate: 4, integerSeparator: '' };
    public mengeNumberFormattingOptions = { padRight: 0, truncate: 3, integerSeparator: '' };

    public currentPeriodHeading$: Observable<string>;

    private preiseFormatFn = format(this.priceNumberFormattingOptions);
    private mengeFormatFn = format(this.mengeNumberFormattingOptions);

    form: FormGroup;

    private subscriptions: Subscription[] = [];

    constructor(formBuilder: FormBuilder, pefDialogService: PefDialogService, translateService: TranslateService) {
        super();

        this.preisChanged$.subscribe(x => { this.form.patchValue({ preis: `${this.preiseFormatFn(x)}` }); });
        this.mengeChanged$.subscribe(x => { this.form.patchValue({ menge: `${this.mengeFormatFn(x)}` }); });
        this.preisVPNormalNeuerArtikelChanged$.subscribe(x => { this.form.patchValue({ preisVPNormalNeuerArtikel: `${this.preiseFormatFn(x)}` }); });
        this.mengeVPNormalNeuerArtikelChanged$.subscribe(x => { this.form.patchValue({ mengeVPNormalNeuerArtikel: `${this.mengeFormatFn(x)}` }); });

        this.form = formBuilder.group({
            pmId: [''],
            preis: ['', Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 4 })])],
            menge: ['', Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 99999.99, { padRight: 2, truncate: 3 })])],
            // preisVPNormalNeuerArtikel: ['', maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 2 })],
            // mengeVPNormalNeuerArtikel: ['', maxMinNumberValidatorFactory(0.01, 999999.99, { padRight: 2, truncate: 2 })],
            preisVPNormalNeuerArtikel: [''],
            mengeVPNormalNeuerArtikel: [''],
            aktion: [false],
            bearbeitungscode: [100, Validators.required],
            artikelnummer: [null],
            artikeltext: [null, Validators.required]
        });

        this.preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
        this.requestPreismeldungSave$ = this.observePropertyCurrentValue<string>('requestPreismeldungSave').filter(x => !!x);
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
            this.requestPreismeldungQuickEqual$.withLatestFrom(this.preismeldung$, (_, currentPm: P.CurrentPreismeldungBag) => currentPm)
                .subscribe(currentPm => {
                    this.form.patchValue({
                        preis: `${currentPm.refPreismeldung ? this.preiseFormatFn(currentPm.refPreismeldung.preis) : ''}`,
                        menge: `${currentPm.refPreismeldung ? currentPm.refPreismeldung.menge : currentPm.refPreismeldung.menge}`,
                        aktion: currentPm.refPreismeldung.aktion
                    });
                })
        );

        this.subscriptions.push(
            this.applyUnitQuickEqual$.withLatestFrom(this.preismeldung$, (_, preismeldung: P.CurrentPreismeldungBag) => preismeldung)
                .subscribe(preismeldung => {
                    this.form.patchValue({
                        menge: `${preismeldung.refPreismeldung ? preismeldung.refPreismeldung.menge : preismeldung.warenkorbPosition.standardmenge}`,
                    });
                })
        );

        this.subscriptions.push(
            this.applyUnitQuickEqualVP$.withLatestFrom(this.preismeldung$, (_, preismeldung: P.CurrentPreismeldungBag) => preismeldung)
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

        this.codeListType$ = this.preismeldung$
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
                        aktion: false
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

        const canSave$ = this.attemptSave$.map(() => ({ saveAction: 'JUST_SAVE' })).merge(this.requestPreismeldungSave$.map(() => ({ saveAction: 'SAVE_AND_MOVE_TO_NEXT' })))
            .map(x => ({ saveAction: x, isValid: this.form.valid }))
            .publishReplay(1).refCount();

        this.save$ = canSave$.filter(x => x.isValid)
            .map(x => x.saveAction)
            .flatMap(saveAction => Observable.defer(() =>
                distinctPreismeldung$.take(1)
                    .flatMap(bag =>
                        ([1, 7].some(code => code === this.form.value.bearbeitungscode) && bag.refPreismeldung.artikeltext === this.form.value.artikeltext && bag.refPreismeldung.artikelnummer === this.form.value.artikelnummer)
                            ? pefDialogService.displayDialog(PefDialogYesNoComponent, translateService.instant('dialogText_unchangedPmText'), false).map(res => res.data) : Observable.of('YES')
                    )
                    .filter(y => y === 'YES')
            ).map(() => saveAction))
            .publishReplay(1).refCount();

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true)
            .merge(distinctPreismeldung$.mapTo(false));

        this.subscriptions.push(
            canSave$.filter(x => !x)
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

        this.preisInvalid$ = this.form.valueChanges.merge(this.attemptSave$).map(() => !!this.form.controls['preis'].errors);
        this.mengeInvalid$ = this.form.valueChanges.merge(this.attemptSave$).map(() => !!this.form.controls['menge'].errors);
    }

    calcPreisAndMengeDisabled(bearbeitungscode: P.Models.Bearbeitungscode) {
        return [0, 44, 101].some(x => x === bearbeitungscode);
    }

    formatPercentageChange = percentageChange => formatPercentageChange(percentageChange, 1);

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}
