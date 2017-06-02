import { Component, EventEmitter, Input, Output, SimpleChange, OnChanges, ChangeDetectionStrategy, OnDestroy, Inject } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { keys, assign } from 'lodash';
import { isBefore } from 'date-fns';

import { ReactiveComponent, formatPercentageChange, maxMinNumberValidatorFactory, PefDialogOneButtonComponent, PefDialogService, PefDialogYesNoComponent, PefDialogYesNoEditComponent } from 'lik-shared';
import { DialogChoosePercentageReductionComponent } from '../../dialog-choose-percentage-reduction/dialog-choose-percentage-reduction';

import * as P from '../../../../../common-models';

import { preisNumberFormattingOptions, preisFormatFn, mengeNumberFormattingOptions, mengeFormatFn } from 'lik-shared';

interface PercentageValues {
    lastPeriodToThisPeriod: string;
}

@Component({
    selector: 'preismeldung-price',
    templateUrl: 'preismeldung-price.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldungPriceComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() currentTime: Date;
    @Input() preismeldung: P.CurrentPreismeldungBag;
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Input() priceCountStatus: P.PriceCountStatus;
    @Input() requestPreismeldungSave: P.SavePreismeldungPriceSaveAction;
    @Input() requestPreismeldungQuickEqual: string;
    @Output('preismeldungPricePayload') preismeldungPricePayload$: Observable<P.PreismeldungPricePayload>;
    @Output('save') save$: Observable<P.SavePreismeldungPriceSaveAction>;
    @Output('duplicatePreismeldung') duplicatePreismeldung$ = new EventEmitter();

    public preismeldung$: Observable<P.CurrentPreismeldungBag>;
    public distinctPreismeldung$: Observable<P.CurrentPreismeldungBag>;
    public requestPreismeldungSave$: Observable<P.SavePreismeldungPriceSaveAction>;
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
    public chooseReductionPercentage$ = new EventEmitter();
    public infoPopoverActive$ = new EventEmitter<boolean>();
    public popoverHeight$: Observable<string>;

    public preisNumberFormattingOptions = preisNumberFormattingOptions;
    public mengeNumberFormattingOptions = mengeNumberFormattingOptions;

    public arrowDownPercentage$: Observable<string>;

    public currentPeriodHeading$: Observable<string>;
    public isSaveDisabled$: Observable<boolean>;

    priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    preismeldestelle$ = this.observePropertyCurrentValue<P.PriceCountStatus>('preismeldestelle');
    currentTime$ = this.observePropertyCurrentValue<Date>('currentTime').publishReplay(1).refCount();

    form: FormGroup;

    private subscriptions: Subscription[] = [];

    constructor(formBuilder: FormBuilder, pefDialogService: PefDialogService, translateService: TranslateService, @Inject('windowObject') public window: any) {
        super();

        this.subscriptions.push(this.preisChanged$.subscribe(x => this.form.patchValue({ preis: `${preisFormatFn(x)}` })));
        this.subscriptions.push(this.mengeChanged$.subscribe(x => this.form.patchValue({ menge: `${mengeFormatFn(x)}` })));
        this.subscriptions.push(this.preisVPNormalNeuerArtikelChanged$.subscribe(x => this.form.patchValue({ preisVPNormalNeuerArtikel: `${preisFormatFn(x)}` })));
        this.subscriptions.push(this.mengeVPNormalNeuerArtikelChanged$.subscribe(x => this.form.patchValue({ mengeVPNormalNeuerArtikel: `${mengeFormatFn(x)}` })));

        this.form = formBuilder.group({
            pmId: [''],
            preis: ['', Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 4 })])],
            menge: ['', Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 99999.99, { padRight: 2, truncate: 3 })])],
            preisVPNormalNeuerArtikel: [''],
            mengeVPNormalNeuerArtikel: [''],
            aktion: [false],
            bearbeitungscode: [100, Validators.required],
            artikelnummer: [''],
            internetLink: [''],
            artikeltext: ['', Validators.required]
        }, { validator: this.formLevelValidationFactory() });

        this.preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
        this.requestPreismeldungSave$ = this.observePropertyCurrentValue<P.SavePreismeldungPriceSaveAction>('requestPreismeldungSave').filter(x => !!x);
        this.requestPreismeldungQuickEqual$ = this.observePropertyCurrentValue<string>('requestPreismeldungQuickEqual').filter(x => !!x);

        this.distinctPreismeldung$ = this.preismeldung$
            .filter(x => !!x)
            .distinctUntilChanged((x, y) => x.pmId === y.pmId && x.resetEvent === y.resetEvent)
            .publishReplay(1).refCount();

        this.preisCurrentValue$ = this.form.valueChanges.map(() => this.form.value.preis)
            .merge(this.distinctPreismeldung$.map(x => x.preismeldung.preis))
            .map(x => ({ value: `${preisFormatFn(x)}` }));

        this.preisVPNormalNeuerArtikelCurrentValue$ = this.form.valueChanges.map(() => this.form.value.preisVPNormalNeuerArtikel)
            .merge(this.distinctPreismeldung$.map(x => x.preismeldung.preisVPNormalNeuerArtikel))
            .map(x => ({ value: `${preisFormatFn(x)}` }));

        this.subscriptions.push(
            this.distinctPreismeldung$
                .subscribe(bag => {
                    this.form.reset({
                        pmId: bag.pmId,
                        preis: bag.preismeldung.preis,
                        menge: bag.preismeldung.menge,
                        aktion: bag.preismeldung.aktion,
                        preisVPNormalNeuerArtikel: bag.preismeldung.preisVPNormalNeuerArtikel,
                        mengeVPNormalNeuerArtikel: bag.preismeldung.mengeVPNormalNeuerArtikel,
                        bearbeitungscode: bag.preismeldung.bearbeitungscode,
                        artikelnummer: bag.preismeldung.artikelnummer,
                        internetLink: bag.preismeldung.internetLink,
                        artikeltext: bag.preismeldung.artikeltext
                    });
                })
        );

        this.subscriptions.push(
            this.preismeldung$
                .filter(x => !!x)
                .subscribe(preismeldung => {
                    this.form.patchValue({
                        aktion: preismeldung.preismeldung.aktion,
                    }, { emitEvent: false });
                })
        );

        this.subscriptions.push(
            this.requestPreismeldungQuickEqual$.withLatestFrom(this.distinctPreismeldung$, (_, currentPm: P.CurrentPreismeldungBag) => currentPm)
                .subscribe(currentPm => {
                    this.form.patchValue({
                        preis: `${currentPm.refPreismeldung ? preisFormatFn(currentPm.refPreismeldung.preis) : ''}`,
                        menge: `${currentPm.refPreismeldung ? mengeFormatFn(currentPm.refPreismeldung.menge) : ''}`,
                        aktion: currentPm.refPreismeldung.aktion
                    });
                })
        );

        this.subscriptions.push(
            this.applyUnitQuickEqual$.withLatestFrom(this.distinctPreismeldung$, (_, preismeldung: P.CurrentPreismeldungBag) => preismeldung)
                .subscribe(preismeldung => {
                    this.form.patchValue({
                        menge: `${preismeldung.refPreismeldung ? mengeFormatFn(preismeldung.refPreismeldung.menge) : mengeFormatFn(preismeldung.warenkorbPosition.standardmenge)}`,
                    });
                })
        );

        this.subscriptions.push(
            this.applyUnitQuickEqualVP$.withLatestFrom(this.distinctPreismeldung$, (_, preismeldung: P.CurrentPreismeldungBag) => preismeldung)
                .subscribe(preismeldung => {
                    this.form.patchValue({
                        mengeVPNormalNeuerArtikel: `${preismeldung.refPreismeldung ? mengeFormatFn(preismeldung.refPreismeldung.menge) : mengeFormatFn(preismeldung.warenkorbPosition.standardmenge)}`,
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

        this.subscriptions.push(
            this.chooseReductionPercentage$
                .flatMap(() => pefDialogService.displayDialog(DialogChoosePercentageReductionComponent, null, true).map(x => x.data))
                .filter(x => x.type === 'OK')
                .withLatestFrom(this.distinctPreismeldung$, (x, currentPm: P.CurrentPreismeldungBag) => ({ currentPm, percentage: x.percentage }))
                .subscribe(({ currentPm, percentage }) => {
                    this.form.patchValue({
                        preis: `${preisFormatFn(currentPm.refPreismeldung.preis * (percentage / 100))}`,
                    });
                })
        );

        this.codeListType$ = this.distinctPreismeldung$
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
                internetLink: this.form.value.internetLink,
                artikeltext: this.form.value.artikeltext
            }));

        const bearbeitungscodeChanged$ = this.changeBearbeitungscode$
            .merge(this.distinctPreismeldung$.map(x => x.preismeldung.bearbeitungscode))
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
                .withLatestFrom(this.distinctPreismeldung$.map(x => x.refPreismeldung), (_, refPreismeldung) => refPreismeldung)
                .subscribe(refPreismeldung => {
                    this.form.patchValue({
                        preis: `${preisFormatFn(refPreismeldung.preis)}`,
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

        const canSave$ = this.attemptSave$.mapTo({ type: 'JUST_SAVE' } as P.SavePreismeldungPriceSaveAction).merge(this.requestPreismeldungSave$)
            .map(x => ({ saveAction: x, isValid: this.form.valid }))
            .publishReplay(1).refCount();

        const saveWithBag$ = canSave$.filter(x => x.isValid)
            .map(x => x.saveAction)
            // .delay(100)
            .withLatestFrom(this.preismeldung$, (saveAction, bag) => ({ saveAction, bag }))
            .publishReplay(1).refCount();

        this.subscriptions.push(
            saveWithBag$.filter(x => x.bag.hasAttributeWarning)
                .flatMap(() => pefDialogService.displayDialog('DialogValidationErrorsComponent', [translateService.instant('validation_produktMerkmale_erfassen')], true))
                .subscribe()
        );

        this.save$ = saveWithBag$
            .filter(x => !x.bag.hasAttributeWarning)
            .flatMap(({ saveAction, bag }) => {
                if (bag.isNew) {
                    return Observable.of({ type: saveAction.type, saveWithData: 'COMMENT' as P.SavePreismeldungPriceSaveActionWithDataType, data: '' });
                }
                if (bag.messages.bemerkungenHistory !== '' && bag.messages.bemerkungen === '') {
                    return pefDialogService.displayDialog('DialogValidationErrorsComponent', [translateService.instant('validation_frage-antworten')], true).map(() => ({ type: 'NO_SAVE_NAVIGATE', data: 'MESSAGES' }));
                }
                if (bag.hasPriceWarning && !bag.messages.kommentar) {
                    return pefDialogService.displayDialog(PefDialogOneButtonComponent, { message: translateService.instant('dialogText_abnormal_preisentwicklung'), buttonText: 'btn_edit' }, false)
                        .map(res => ({ type: 'CANCEL' }));
                }
                if ([1, 7].some(code => code === this.form.value.bearbeitungscode) && bag.refPreismeldung.artikeltext === this.form.value.artikeltext && bag.refPreismeldung.artikelnummer === this.form.value.artikelnummer) {
                    return pefDialogService.displayDialog(PefDialogYesNoComponent, translateService.instant('dialogText_unchangedPmText'), false)
                        .map(res => res.data === 'YES' ? { type: saveAction.type, saveWithData: 'COMMENT', data: 'kommentar-autotext_artikeltext_unverändert_bestätigt' } : { type: 'CANCEL' });
                }
                if (this.form.value.bearbeitungscode === 101 && /^R+$/.exec(bag.refPreismeldung.fehlendePreiseR) && bag.refPreismeldung.fehlendePreiseR.length >= 2) {
                    return pefDialogService.displayDialog(PefDialogYesNoComponent, translateService.instant('dialogText_rrr-message-mit-aufforderung-zu-produktersatz'), false)
                        .map(res => res.data === 'YES' ? { type: 'CANCEL' } : { type: saveAction.type, saveWithData: 'COMMENT', data: 'kommentar-autotext_keine_ersatzprodukte' });
                }
                if (this.form.value.aktion && bag.refPreismeldung.aktion && this.form.value.preis > bag.refPreismeldung.preis) {
                    return pefDialogService.displayDialog(PefDialogYesNoEditComponent, translateService.instant('dialogText_aktion-message-preis_hoeher'), false)
                        .map(res => res.data === 'EDIT' ? { type: 'CANCEL' } :
                            res.data === 'YES'
                                ? { type: saveAction.type, saveWithData: 'COMMENT', data: 'kommentar-autotext_steigender_aktionspreis_bestätigt' }
                                : { type: saveAction.type, saveWithData: 'AKTION', data: false });
                }
                if (!this.form.value.aktion && !!bag.refPreismeldung && bag.refPreismeldung.aktion && this.form.value.preis <= bag.refPreismeldung.preis) {
                    return pefDialogService.displayDialog(PefDialogYesNoEditComponent, translateService.instant('dialogText_not-aktion-message-billiger'), false)
                        .map(res => res.data === 'EDIT' ? { type: 'CANCEL' } :
                            res.data === 'YES'
                                ? { type: saveAction.type, saveWithData: 'AKTION', data: true }
                                : { type: saveAction.type, saveWithData: 'COMMENT', data: 'kommentar-autotext_normalpreis_billiger' });
                }
                if (this.form.value.bearbeitungscode === 0) {
                    const params = {
                        numActivePrices: bag.priceCountStatus.numActivePrices - 1,
                        anzahlPreiseProPMS: bag.priceCountStatus.anzahlPreiseProPMS
                    };
                    return pefDialogService.displayDialog(PefDialogYesNoComponent, translateService.instant('dialogText_aufforderung_ersatzsuche', params), false)
                        .map(res => res.data === 'YES'
                            ? { type: 'SAVE_AND_DUPLICATE_PREISMELDUNG', saveWithData: 'COMMENT', data: '' }
                            : { type: saveAction.type, saveWithData: 'COMMENT', data: 'kommentar-autotext_keine_produkte' }
                        );
                }
                return Observable.of({ type: saveAction.type, saveWithData: 'COMMENT', data: '' });
            })
            .filter(x => x.type !== ('CANCEL' as P.SavePreismeldungPriceSaveActionType));

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true)
            .merge(this.distinctPreismeldung$.mapTo(false));

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
                .flatMap(errorMessages => pefDialogService.displayDialog('DialogValidationErrorsComponent', errorMessages, true))
                .subscribe()
        );

        this.isSaveDisabled$ = this.distinctPreismeldung$.combineLatest(this.currentTime$, (bag, currentTime) => {
            if (!bag || !bag.refPreismeldung) return false;
            const dateRegex = /(\d+)\.(\d+)\.(\d+)/;
            const parsed = dateRegex.exec(bag.refPreismeldung.erhebungsAnfangsDatum);
            if (!parsed) return false;
            const erhebungsAnfangsDatum = new Date(+parsed[3], +parsed[2] - 1, +parsed[1] - 1);
            return isBefore(currentTime, erhebungsAnfangsDatum) ? true : false;
        }).publishReplay(1).refCount();

        this.currentPeriodHeading$ = this.changeBearbeitungscode$.merge(this.distinctPreismeldung$.map(x => x.preismeldung.bearbeitungscode))
            .map(x => x === 7 || x === 2 || x === 3 ? 'heading_artikel-neu' : 'heading_artikel');

        const showInvalid$ = this.form.valueChanges.merge(this.attemptSave$).publishReplay(1).refCount();
        this.createInvalidObservableFor = (controlName: string) => showInvalid$.map(() => !!this.form.controls[controlName].errors);

        this.popoverHeight$ = this.changeBearbeitungscode$.merge(this.distinctPreismeldung$.map(x => x.preismeldung.bearbeitungscode))
            .delay(0)
            .map(x => x === 7 ? (window.document.getElementById('row-2-last-period').offsetHeight - 8) + 'px' : window.document.getElementById('last-period-data-input-area').offsetHeight + 'px');

        this.arrowDownPercentage$ = this.infoPopoverActive$
            .combineLatest(this.preismeldung$, (infoPopoverActive, bag) => {
                const n = !bag ? null : infoPopoverActive ? bag.preismeldung.percentageVPNeuerArtikelToVPVorReduktion : bag.preismeldung.percentageVPNeuerArtikelToVPAlterArtikel;
                return this.formatPercentageChange(n);
            });
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
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
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

    navigateToInternetLink(internetLink: string) {
        if (!internetLink) return;
        if (!internetLink.startsWith('http://') || !internetLink.startsWith('https://')) {
            this.window.open(`http://${internetLink}`, '_blank');
        }
    }
}
