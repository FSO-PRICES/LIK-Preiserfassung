import { Component, EventEmitter, Input, Output, SimpleChange, OnChanges, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from 'ng2-translate';
import { keys, assign } from 'lodash';
import * as format from 'format-number';

import { ReactiveComponent, formatPercentageChange, maxMinNumberValidatorFactory, PefDialogService } from 'lik-shared';

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

    public changeBearbeitungscode$ = new EventEmitter<P.Models.Bearbeitungscode>();
    public preisAndMengeDisabled$: Observable<boolean>;
    public isVerkettung$: Observable<boolean>;
    public selectedProcessingCode$ = new EventEmitter<any>();

    public preisChanged$ = new EventEmitter<string>();
    public preisInvalid$: Observable<boolean>;
    public mengeChanged$ = new EventEmitter<string>();
    public mengeInvalid$: Observable<boolean>;

    public preisVPNormalNeuerArtikelChanged$ = new EventEmitter<string>();
    public mengeVPNormalNeuerArtikelChanged$ = new EventEmitter<string>();

    public toggleAktion$ = new EventEmitter();
    public showSaveWarning$: Observable<boolean>;
    public percentageValues$: Observable<PercentageValues>;
    public attemptSave$ = new EventEmitter();
    public showValidationHints$: Observable<boolean>;
    public applyUnitQuickEqual$ = new EventEmitter();

    public numberFormattingOptions = { padRight: 2, truncate: 2, integerSeparator: '' };

    public currentPeriodHeading$: Observable<string>;

    private formatFn = format(this.numberFormattingOptions);

    form: FormGroup;

    private subscriptions: Subscription[] = [];

    constructor(formBuilder: FormBuilder, pefDialogService: PefDialogService, translateService: TranslateService) {
        super();

        this.preisChanged$.subscribe(x => { this.form.patchValue({ preis: `${this.formatFn(x)}` }); });
        this.mengeChanged$.subscribe(x => { this.form.patchValue({ menge: `${x}` }); });
        this.preisVPNormalNeuerArtikelChanged$.subscribe(x => { this.form.patchValue({ preisVPNormalNeuerArtikel: `${this.formatFn(x)}` }); });
        this.mengeVPNormalNeuerArtikelChanged$.subscribe(x => { this.form.patchValue({ mengeVPNormalNeuerArtikel: `${x}` }); });

        this.form = formBuilder.group({
            pmId: [''],
            preis: ['', Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 2 })])],
            menge: ['', Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 99999.99, { padRight: 2, truncate: 2 })])],
            preisVPNormalNeuerArtikel: ['', maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 2 })],
            mengeVPNormalNeuerArtikel: ['', maxMinNumberValidatorFactory(0.01, 999999.99, { padRight: 2, truncate: 2 })],
            aktion: [false],
            bearbeitungscode: [100, Validators.required],
            artikelNummer: [null],
            artikelText: [null, Validators.required]
        });

        this.preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
        this.requestPreismeldungSave$ = this.observePropertyCurrentValue<string>('requestPreismeldungSave').filter(x => !!x);
        this.requestPreismeldungQuickEqual$ = this.observePropertyCurrentValue<string>('requestPreismeldungQuickEqual').filter(x => !!x);

        const distinctPreismeldung$ = this.preismeldung$
            .filter(x => !!x)
            .distinctUntilKeyChanged('pmId')
            .publishReplay(1).refCount();

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
                        artikelNummer: preismeldung.preismeldung.artikelnummer,
                        artikelText: preismeldung.preismeldung.artikeltext
                    });
                })
        );

        this.subscriptions.push(
            this.requestPreismeldungQuickEqual$.withLatestFrom(this.preismeldung$, (_, currentPm: P.CurrentPreismeldungBag) => currentPm)
                .subscribe(currentPm => {
                    if (currentPm.preismeldung.bearbeitungscode === 7) {
                        this.form.patchValue({
                            preis: currentPm.preismeldung.preisVPNormalNeuerArtikel,
                            menge: currentPm.preismeldung.mengeVPNormalNeuerArtikel
                        });
                    } else {
                        this.form.patchValue({
                            preis: `${this.formatFn(currentPm.refPreismeldung.preis)}`,
                            menge: `${currentPm.refPreismeldung.menge}`
                        });
                    }
                })
        );

        this.subscriptions.push(
            this.applyUnitQuickEqual$.withLatestFrom(this.preismeldung$, (_, preismeldung: P.CurrentPreismeldungBag) => preismeldung)
                .subscribe(preismeldung => {
                    this.form.patchValue({
                        menge: `${preismeldung.warenkorbPosition.standardmenge}`,
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

        this.preismeldungPricePayload$ = this.form.valueChanges
            .map(() => ({
                preis: this.form.value.preis,
                menge: this.form.value.menge,
                aktion: this.form.value.aktion,
                preisVPNormalNeuerArtikel: this.form.value.preisVPNormalNeuerArtikel,
                mengeVPNormalNeuerArtikel: this.form.value.mengeVPNormalNeuerArtikel,
                bearbeitungscode: this.form.value.bearbeitungscode,
                artikelnummer: this.form.value.artikelNummer,
                artikeltext: this.form.value.artikelText
            }));

        const bearbeitungscodeChanged$ = this.changeBearbeitungscode$
            .merge(distinctPreismeldung$.map(x => x.preismeldung.bearbeitungscode))
            .publishReplay(1).refCount();

        this.preisAndMengeDisabled$ = bearbeitungscodeChanged$
            .map(x => this.calcPreisAndMengeDisabled(x));

        this.isVerkettung$ = bearbeitungscodeChanged$
            .map(x => x === 7)
            .publishReplay(1).refCount();

        this.subscriptions.push(
            this.isVerkettung$
                .filter(x => !x && this.form.dirty)
                .subscribe(() => {
                    this.form.patchValue({
                        preisVPNormalOverride: '',
                        mengeVPNormalOverride: ''
                    });
                })
        );

        this.subscriptions.push(
            this.preisAndMengeDisabled$
                .filter(x => x && this.form.dirty)
                .withLatestFrom(distinctPreismeldung$.map(x => x.refPreismeldung), (_, refPreismeldung) => refPreismeldung)
                .subscribe(refPreismeldung => {
                    this.form.patchValue({
                        preis: `${this.formatFn(refPreismeldung.preis)}`,
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
            .map(x => x === 7 ? 'heading_artikel-neu' : 'heading_artikel');

        this.preisInvalid$ = this.form.valueChanges.merge(this.attemptSave$).map(() => !!this.form.controls['preis'].errors);
        this.mengeInvalid$ = this.form.valueChanges.merge(this.attemptSave$).map(() => !!this.form.controls['menge'].errors);
    }

    calcPreisAndMengeDisabled(bearbeitungscode: P.Models.Bearbeitungscode) {
        return [0, 44, 101].some(x => x === bearbeitungscode);
    }

    formatPercentageChange = percentageChange => formatPercentageChange(percentageChange, 2);

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}
