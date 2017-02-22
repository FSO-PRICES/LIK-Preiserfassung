import { Component, EventEmitter, Input, Output, SimpleChange, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from 'ng2-translate';
import { keys } from 'lodash';
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
export class PreismeldungPriceComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() requestPreismeldungSave: string;
    @Input() requestPreismeldungQuickEqual: string;
    @Output('preismeldungPricePayload') preismeldungPricePayload$: Observable<P.PreismeldungPricePayload>;
    @Output('save') save$: Observable<{ saveAction: P.SavePreismeldungPricePayloadType }>;

    public preismeldung$: Observable<P.PreismeldungBag>;
    public requestPreismeldungSave$: Observable<string>;
    public requestPreismeldungQuickEqual$: Observable<string>;

    public changeBearbeitungscode$ = new EventEmitter<P.Models.Bearbeitungscode>();
    public preisAndMengeDisabled$: Observable<boolean>;
    public isVerkettung$: Observable<boolean>;
    public selectedProcessingCode$ = new EventEmitter<any>();
    public formValueChanged$ = new EventEmitter<string>();

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

    constructor(formBuilder: FormBuilder, pefDialogService: PefDialogService, translateService: TranslateService) {
        super();

        this.form = formBuilder.group({
            pmId: [''],
            preis: ['', Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 2 })])],
            menge: ['', Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 99999.99, { padRight: 2, truncate: 2 })])],
            preisVPNormalOverride: ['', maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 2 })],
            mengeVPNormalOverride: ['', maxMinNumberValidatorFactory(0.01, 999999.99, { padRight: 2, truncate: 2 })],
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

        distinctPreismeldung$
            .subscribe(preismeldung => {
                this.form.reset({
                    pmId: preismeldung.pmId,
                    preis: preismeldung.preismeldung.preis,
                    menge: preismeldung.preismeldung.menge,
                    aktion: preismeldung.preismeldung.aktion,
                    bearbeitungscode: preismeldung.preismeldung.bearbeitungscode,
                    artikelNummer: preismeldung.preismeldung.artikelnummer,
                    artikelText: preismeldung.preismeldung.artikeltext
                });
            });

        this.requestPreismeldungQuickEqual$.withLatestFrom(this.preismeldung$, (_, currentPm: P.CurrentPreismeldungViewModel) => currentPm)
            .subscribe(currentPm => {
                this.form.patchValue({
                    preis: `${this.formatFn(currentPm.refPreismeldung.preis)}`,
                    menge: `${currentPm.refPreismeldung.menge}`,
                });
            });

        this.applyUnitQuickEqual$.withLatestFrom(this.preismeldung$, (_, preismeldung: P.CurrentPreismeldungViewModel) => preismeldung)
            .subscribe(preismeldung => {
                this.form.patchValue({
                    menge: `${preismeldung.refPreismeldung.menge}`,
                });
            });

        this.toggleAktion$
            .subscribe(() => {
                this.form.patchValue({
                    aktion: !this.form.value.aktion
                });
            });

        this.preismeldungPricePayload$ = this.form.valueChanges
            .map(() => ({
                preis: this.form.value.preis,
                menge: this.form.value.menge,
                aktion: this.form.value.aktion,
                preisVPNormalOverride: this.form.value.preisVPNormalOverride,
                mengeVPNormalOverride: this.form.value.mengeVPNormalOverride,
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

        this.isVerkettung$
            .filter(x => !x && this.form.dirty)
            .subscribe(() => {
                this.form.patchValue({
                    preisVPNormalOverride: '',
                    mengeVPNormalOverride: ''
                });
            });

        this.preisAndMengeDisabled$
            .filter(x => x)
            .withLatestFrom(distinctPreismeldung$.map(x => x.refPreismeldung), (_, refPreismeldung) => refPreismeldung)
            .subscribe(refPreismeldung => {
                this.form.patchValue({
                    preis: `${this.formatFn(refPreismeldung.preis)}`,
                    menge: `${refPreismeldung.menge}`,
                    aktion: false
                });
            });

        this.preisAndMengeDisabled$
            .distinctUntilChanged()
            .filter(x => !x && this.form.dirty)
            .subscribe(() => {
                this.form.patchValue({
                    preis: '',
                    menge: '',
                    aktion: false
                });
            });

        const canSave$ = this.attemptSave$.map(() => ({ saveAction: 'JUST_SAVE' })).merge(this.requestPreismeldungSave$.map(() => ({ saveAction: 'SAVE_AND_MOVE_TO_NEXT' })))
            .map(x => ({ saveAction: x, isValid: this.form.valid }))
            .publishReplay(1).refCount();
        this.save$ = canSave$.filter(x => x.isValid)
            .map(x => x.saveAction)
            .publishReplay(1).refCount();

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true)
            .merge(distinctPreismeldung$.mapTo(false));

        canSave$.filter(x => !x)
            .map(() =>
                keys(this.form.controls)
                    .filter(x => !!this.form.controls[x].errors)
                    .map(controlName => {
                        const control = this.form.controls[controlName];
                        const errorKey = keys(control.errors)[0];
                        const errorParams = Object.assign({}, control.errors[errorKey], { controlName: translateService.instant(`control_${controlName}`) });
                        return translateService.instant(`validation_formatted_${errorKey}`, errorParams);
                    })
            )
            .flatMap(errorMessages => pefDialogService.displayDialog(DialogValidationErrorsComponent, errorMessages, true))
            .subscribe();

        this.currentPeriodHeading$ = this.changeBearbeitungscode$.merge(distinctPreismeldung$.map(x => x.preismeldung.bearbeitungscode))
            .combineLatest(this.form.valueChanges.merge(distinctPreismeldung$.map(x => x.preismeldung)), (bearbeitungscode, preismeldung) => ({ bearbeitungscode, preismeldung }))
            .map(x => {
                if (x.bearbeitungscode === 7) {
                    return x.preismeldung.aktion ? 'heading_reducedPriceNewArticle' : 'heading_normalPriceNewArticle';
                } else {
                    return x.preismeldung.aktion ? 'heading_reducedPrice' : 'heading_normalPrice';
                }
            });
    }

    calcPreisAndMengeDisabled(bearbeitungscode: P.Models.Bearbeitungscode) {
        return [0, 44, 101].some(x => x === bearbeitungscode);
    }

    formatPercentageChange = percentageChange => formatPercentageChange(percentageChange, 2);

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
