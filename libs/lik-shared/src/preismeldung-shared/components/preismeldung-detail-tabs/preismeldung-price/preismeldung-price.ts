import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChange,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { assign, keys } from 'lodash';
import { ElectronService } from 'ngx-electron';
import { WINDOW } from 'ngx-window-token';
import { defer, iif as observableIif, Observable, of as observableOf, Subscription } from 'rxjs';
import {
    combineLatest,
    distinctUntilChanged,
    filter,
    map,
    mapTo,
    merge,
    mergeMap,
    publishReplay,
    refCount,
    startWith,
    withLatestFrom,
} from 'rxjs/operators';

import {
    formatPercentageChange,
    maxMinNumberValidatorFactory,
    mengeFormatFn,
    mengeNumberFormattingOptions,
    parseErhebungsarten,
    PefDialogService,
    PefMessageDialogService,
    preisFormatFn,
    preisNumberFormattingOptions,
    ReactiveComponent,
} from '../../../../common';
import { PefDialogValidationErrorsComponent } from '../../../../pef-components';
import * as P from '../../../models';
import { DialogChoosePercentageReductionComponent } from '../../dialog-choose-percentage-reduction/dialog-choose-percentage-reduction';

@Component({
    selector: 'preismeldung-price',
    styleUrls: ['./preismeldung-price.scss'],
    templateUrl: 'preismeldung-price.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungPriceComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldung: P.CurrentPreismeldungViewBag;
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Input() isAdminApp: boolean;
    @Input() requestPreismeldungSave: P.SavePreismeldungPriceSaveAction;
    @Input() requestPreismeldungQuickEqual: string;
    @Input() isDesktop: boolean;
    @Output('preismeldungPricePayload') preismeldungPricePayload$: Observable<P.PreismeldungPricePayload>;
    @Output('save') save$: Observable<P.SavePreismeldungPriceSaveAction | string>;
    @Output('duplicatePreismeldung') duplicatePreismeldung$ = new EventEmitter();
    @Output('requestSelectNextPreismeldung') requestSelectNextPreismeldung$ = new EventEmitter<{}>();
    @Output('requestThrowChanges') requestThrowChanges$: Observable<{}>;
    @Output('isSaveLookDisabled') public isSaveLookDisabled$: Observable<boolean>;
    @Output('disableQuickEqual') disableQuickEqual$: Observable<boolean>;

    public isReadonly$: Observable<boolean>;

    public preismeldung$: Observable<P.CurrentPreismeldungViewBag>;
    public distinctPreismeldung$: Observable<P.CurrentPreismeldungViewBag>;
    public requestPreismeldungSave$: Observable<P.SavePreismeldungPriceSaveAction>;
    public requestPreismeldungQuickEqual$: Observable<string>;
    public codeListType$: Observable<string>;

    public changeBearbeitungscode$ = new EventEmitter<P.Models.Bearbeitungscode>();
    public preisAndMengeDisabled$: Observable<boolean>;
    public aktionDisabled$: Observable<boolean>;
    public showVPArtikelNeu$: Observable<boolean>;
    public selectedProcessingCode$ = new EventEmitter<any>();

    public preisChanged$ = new EventEmitter<string>();
    public preisCurrentValue$: Observable<{ value: string }>;
    public mengeChanged$ = new EventEmitter<string>();
    public preisVorReduktionChanged$ = new EventEmitter<string>();
    public mengeVorReduktionChanged$ = new EventEmitter<string>();
    public createInvalidObservableFor: (controlName: string) => Observable<boolean>;

    public preisVPKChanged$ = new EventEmitter<string>();
    public preisVPKCurrentValue$: Observable<{ value: string }>;
    public mengeVPKChanged$ = new EventEmitter<string>();

    public toggleAktion$ = new EventEmitter<boolean>();
    public showSaveWarning$: Observable<boolean>;
    public attemptSave$ = new EventEmitter();
    public showValidationHints$: Observable<boolean>;
    public applyUnitQuickEqual$ = new EventEmitter();
    public applyUnitQuickEqualVP$ = new EventEmitter();
    public chooseReductionPercentage$ = new EventEmitter();
    public infoPopoverLeftActive$ = new EventEmitter<boolean>();
    public infoPopoverRightActive$ = new EventEmitter<boolean>();
    public closePopoverRight$: Observable<any>;
    public preisNumberFormattingOptions = preisNumberFormattingOptions;
    public mengeNumberFormattingOptions = mengeNumberFormattingOptions;

    public arrowDown$: Observable<P.Models.PercentageWithWarning>;
    public arrowRight$: Observable<P.Models.PercentageWithWarning>;

    public currentPeriodHeading$: Observable<string>;
    public isSaveDisabled$: Observable<boolean>;

    public isInternet$: Observable<boolean>;

    public preisInput$ = new EventEmitter<string>();
    public mengeInput$ = new EventEmitter<string>();
    public preisVorReduktionInput$ = new EventEmitter<string>();
    public mengeVorReduktionInput$ = new EventEmitter<string>();

    priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle');
    isDesktop$ = this.observePropertyCurrentValue<boolean>('isDesktop');
    isAdminApp$ = this.observePropertyCurrentValue<boolean>('isAdminApp').pipe(
        publishReplay(1),
        refCount(),
    );

    form: FormGroup;

    private subscriptions: Subscription[] = [];

    constructor(
        formBuilder: FormBuilder,
        pefDialogService: PefDialogService,
        pefMessageDialogService: PefMessageDialogService,
        translateService: TranslateService,
        @Inject(WINDOW) public wndw: Window,
        private electronService: ElectronService,
    ) {
        super();

        const infoPopoverLeftActive$ = this.infoPopoverLeftActive$.pipe(
            startWith(false),
            publishReplay(1),
            refCount(),
        );
        const infoPopoverRightActive$ = this.infoPopoverRightActive$.pipe(
            startWith(false),
            publishReplay(1),
            refCount(),
        );

        this.disableQuickEqual$ = infoPopoverRightActive$;

        this.subscriptions.push(
            this.preisChanged$.subscribe(x => this.form.patchValue({ preis: `${preisFormatFn(x)}` })),
        );
        this.subscriptions.push(
            this.mengeChanged$.subscribe(x => this.form.patchValue({ menge: `${mengeFormatFn(x)}` })),
        );
        this.subscriptions.push(
            this.preisVorReduktionChanged$.subscribe(x =>
                this.form.patchValue({ preisVorReduktion: `${preisFormatFn(x)}` }),
            ),
        );
        this.subscriptions.push(
            this.mengeVorReduktionChanged$.subscribe(x =>
                this.form.patchValue({ mengeVorReduktion: `${mengeFormatFn(x)}` }),
            ),
        );
        this.subscriptions.push(
            this.preisVPKChanged$.subscribe(x => this.form.patchValue({ preisVPK: `${preisFormatFn(x)}` })),
        );
        this.subscriptions.push(
            this.mengeVPKChanged$.subscribe(x => this.form.patchValue({ mengeVPK: `${mengeFormatFn(x)}` })),
        );

        this.isInternet$ = this.preismeldestelle$.pipe(map(p => !!p && this.isInternet(p.erhebungsart)));

        this.form = formBuilder.group(
            {
                pmId: [''],
                preis: [
                    '',
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 4 }),
                    ]),
                ],
                menge: [
                    '',
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 9999999.99, { padRight: 2, truncate: 3 }),
                    ]),
                ],
                preisVorReduktion: [''],
                mengeVorReduktion: [''],
                preisVPK: [''],
                mengeVPK: [''],
                aktion: [false],
                bearbeitungscode: [100, Validators.required],
                artikelnummer: [''],
                internetLink: [''],
                artikeltext: ['', Validators.required],
            },
            { validator: this.formLevelValidationFactory() },
        );

        this.preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungViewBag>('preismeldung').pipe(
            publishReplay(1),
            refCount(),
        );
        this.requestPreismeldungSave$ = this.observePropertyCurrentValue<P.SavePreismeldungPriceSaveAction>(
            'requestPreismeldungSave',
        ).pipe(filter(x => !!x));
        this.requestPreismeldungQuickEqual$ = this.observePropertyCurrentValue<string>(
            'requestPreismeldungQuickEqual',
        ).pipe(filter(x => !!x));

        this.distinctPreismeldung$ = this.preismeldung$.pipe(
            filter(x => !!x),
            distinctUntilChanged((x, y) => x.pmId === y.pmId && x.resetEvent === y.resetEvent),
            publishReplay(1),
            refCount(),
        );

        this.preisCurrentValue$ = this.form.valueChanges
            .pipe(
                map(() => this.form.value.preis),
                merge(this.distinctPreismeldung$.pipe(map(x => x.preismeldung.preis))),
                map(x => ({ value: `${preisFormatFn(x)}` })),
            )
            .pipe(
                publishReplay(1),
                refCount(),
            );
        this.subscriptions.push(this.preisCurrentValue$.subscribe());

        this.preisVPKCurrentValue$ = this.form.valueChanges.pipe(
            map(() => this.form.value.preisVPK),
            merge(this.distinctPreismeldung$.pipe(map(x => x.preismeldung.preisVPK))),
            map(x => ({ value: `${preisFormatFn(x)}` })),
        );

        this.closePopoverRight$ = this.distinctPreismeldung$.pipe(
            merge(
                this.preismeldung$.pipe(
                    filter(x => !!x && !x.preismeldung.aktion),
                    map(() => ({})),
                ),
            ),
        );

        this.subscriptions.push(
            this.distinctPreismeldung$.subscribe(bag => {
                this.form.reset({
                    pmId: bag.pmId,
                    preis: bag.preismeldung.preis,
                    menge: bag.preismeldung.menge,
                    preisVorReduktion: bag.preismeldung.preisVorReduktion,
                    mengeVorReduktion: bag.preismeldung.mengeVorReduktion,
                    aktion: bag.preismeldung.aktion,
                    preisVPK: bag.preismeldung.preisVPK,
                    mengeVPK: bag.preismeldung.mengeVPK,
                    bearbeitungscode: bag.preismeldung.bearbeitungscode,
                    artikelnummer: bag.preismeldung.artikelnummer,
                    internetLink: bag.preismeldung.internetLink,
                    artikeltext: bag.preismeldung.artikeltext,
                });
            }),
        );

        this.subscriptions.push(
            this.preismeldung$.pipe(filter(x => !!x)).subscribe(preismeldung => {
                this.form.patchValue(
                    {
                        aktion: preismeldung.preismeldung.aktion,
                    },
                    { emitEvent: false },
                );
            }),
        );

        this.subscriptions.push(
            this.requestPreismeldungQuickEqual$
                .pipe(withLatestFrom(this.distinctPreismeldung$, (_, currentPm: P.CurrentPreismeldungBag) => currentPm))
                .subscribe(currentPm => {
                    this.form.patchValue({
                        preis: `${currentPm.refPreismeldung ? preisFormatFn(currentPm.refPreismeldung.preis) : ''}`,
                        menge: `${currentPm.refPreismeldung ? mengeFormatFn(currentPm.refPreismeldung.menge) : ''}`,
                        aktion: currentPm.refPreismeldung.aktion,
                    });
                }),
        );

        this.subscriptions.push(
            this.applyUnitQuickEqual$
                .pipe(
                    withLatestFrom(
                        this.distinctPreismeldung$,
                        infoPopoverRightActive$,
                        (_, preismeldung: P.CurrentPreismeldungBag, infoPopoverRightActive: boolean) => ({
                            preismeldung,
                            infoPopoverRightActive,
                        }),
                    ),
                )
                .subscribe(({ preismeldung, infoPopoverRightActive }) => {
                    if (!infoPopoverRightActive) {
                        this.form.patchValue({
                            menge: `${
                                preismeldung.refPreismeldung
                                    ? mengeFormatFn(preismeldung.refPreismeldung.menge)
                                    : mengeFormatFn(preismeldung.warenkorbPosition.standardmenge)
                            }`,
                        });
                    } else {
                        this.form.patchValue({
                            mengeVorReduktion: `${
                                preismeldung.refPreismeldung
                                    ? mengeFormatFn(preismeldung.refPreismeldung.menge)
                                    : mengeFormatFn(preismeldung.warenkorbPosition.standardmenge)
                            }`,
                        });
                    }
                }),
        );

        this.subscriptions.push(
            this.applyUnitQuickEqualVP$
                .pipe(
                    withLatestFrom(
                        this.distinctPreismeldung$,
                        (_, preismeldung: P.CurrentPreismeldungBag) => preismeldung,
                    ),
                )
                .subscribe(preismeldung => {
                    this.form.patchValue({
                        mengeVPK: `${
                            preismeldung.refPreismeldung
                                ? mengeFormatFn(preismeldung.refPreismeldung.menge)
                                : mengeFormatFn(preismeldung.warenkorbPosition.standardmenge)
                        }`,
                    });
                }),
        );

        this.subscriptions.push(
            this.toggleAktion$.subscribe(newAktionValue => {
                this.form.patchValue({
                    aktion: newAktionValue,
                });
            }),
        );

        const bearbeitungscodeChanged$ = this.changeBearbeitungscode$
            .pipe(merge(this.distinctPreismeldung$.pipe(map(x => x.preismeldung.bearbeitungscode))))
            .pipe(
                publishReplay(1),
                refCount(),
            );

        this.subscriptions.push(
            this.toggleAktion$
                .pipe(
                    combineLatest(bearbeitungscodeChanged$, (newAktionValue, bearbeitungscode) => ({
                        newAktionValue,
                        bearbeitungscode,
                    })),
                )
                .subscribe(x => {
                    if (!x.newAktionValue || x.bearbeitungscode !== 1) {
                        this.form.patchValue({
                            preisVorReduktion: '',
                            mengeVorReduktion: '',
                        });
                    }
                }),
        );

        this.subscriptions.push(
            this.chooseReductionPercentage$
                .pipe(
                    mergeMap(() =>
                        pefDialogService
                            .displayDialog(DialogChoosePercentageReductionComponent, {
                                dialogOptions: { backdropDismiss: true, cssClass: 'editable-popover' },
                            })
                            .pipe(map(x => x.data)),
                    ),
                    filter(x => !!x && x.type === 'OK'),
                )
                .subscribe(({ percentage }) => {
                    const currentPreis = parseFloat(this.form.value.preis);
                    if (isNaN(currentPreis)) return;
                    this.form.patchValue({
                        preis: `${(currentPreis - currentPreis * (percentage / 100)).toFixed(2)}`,
                    });
                }),
        );

        this.codeListType$ = this.distinctPreismeldung$.pipe(
            map(x =>
                x.preismeldung.bearbeitungscode === 2 || x.preismeldung.bearbeitungscode === 3 ? 'NEW_PM' : 'STANDARD',
            ),
        );

        this.preismeldungPricePayload$ = this.form.valueChanges.pipe(
            map(() => ({
                preis: this.form.value.preis,
                menge: this.form.value.menge,
                aktion: this.form.value.aktion,
                preisVorReduktion: this.form.value.preisVorReduktion,
                mengeVorReduktion: this.form.value.mengeVorReduktion,
                preisVPK: this.form.value.preisVPK,
                mengeVPK: this.form.value.mengeVPK,
                bearbeitungscode: this.form.value.bearbeitungscode,
                artikelnummer: this.form.value.artikelnummer,
                internetLink: this.form.value.internetLink,
                artikeltext: this.form.value.artikeltext,
            })),
        );

        this.isReadonly$ = this.distinctPreismeldung$.pipe(map(x => x.isReadonly)).pipe(
            publishReplay(1),
            refCount(),
        );

        this.isSaveDisabled$ = this.preismeldung$.pipe(
            filter(x => !!x),
            combineLatest(this.isReadonly$, (bag, isReadonly) => !bag.isModified || isReadonly),
            distinctUntilChanged(),
            publishReplay(1),
            refCount(),
        );

        const hasChanged = (
            input$: Observable<string>,
            changed$: Observable<string>,
            selector: (bag: P.CurrentPreismeldungViewBag) => string,
        ) =>
            input$.pipe(
                withLatestFrom(
                    changed$.pipe(
                        merge(
                            this.preismeldung$.pipe(
                                filter(x => !!x),
                                map(selector),
                            ),
                        ),
                    ),
                    (i, c) => +i === +c,
                ),
            );

        this.isSaveLookDisabled$ = this.distinctPreismeldung$.pipe(
            combineLatest(
                hasChanged(this.preisInput$, this.preisChanged$, bag => bag.preismeldung.preis).pipe(
                    merge(
                        hasChanged(this.mengeInput$, this.mengeChanged$, bag => bag.preismeldung.menge),
                        hasChanged(
                            this.preisVorReduktionInput$,
                            this.preisVorReduktionChanged$,
                            bag => bag.preismeldung.preisVorReduktion,
                        ),
                        hasChanged(
                            this.mengeVorReduktionInput$,
                            this.mengeVorReduktionChanged$,
                            bag => bag.preismeldung.mengeVorReduktion,
                        ),
                        this.preismeldung$.pipe(
                            filter(x => !!x),
                            map(x => x.isModified),
                            distinctUntilChanged(),
                            map(x => !x),
                        ),
                    ),
                    startWith(true),
                    distinctUntilChanged(),
                ),
                (bag, changed) => (!bag || bag.isReadonly ? true : changed),
            ),
            distinctUntilChanged(),
            publishReplay(1),
            refCount(),
        );

        this.preisAndMengeDisabled$ = bearbeitungscodeChanged$.pipe(
            map(x => this.calcPreisAndMengeDisabled(x)),
            combineLatest(
                this.isReadonly$,
                (disabledBasedOnBearbeitungsCode, isReadonly) => disabledBasedOnBearbeitungsCode || isReadonly,
            ),
            publishReplay(1),
            refCount(),
        );

        this.aktionDisabled$ = this.preisAndMengeDisabled$.pipe(
            combineLatest(
                bearbeitungscodeChanged$,
                (preisAndMengeDisabled, bearbeitungsCode) => preisAndMengeDisabled || bearbeitungsCode === 3,
            ),
            publishReplay(1),
            refCount(),
        );

        this.showVPArtikelNeu$ = bearbeitungscodeChanged$.pipe(map(x => x === 7 || x === 2)).pipe(
            publishReplay(1),
            refCount(),
        );

        this.subscriptions.push(
            this.showVPArtikelNeu$.pipe(filter(x => !x && this.form.dirty)).subscribe(() => {
                this.form.patchValue({
                    preisVPK: '',
                    mengeVPK: '',
                });
            }),
        );

        this.subscriptions.push(
            this.preisAndMengeDisabled$
                .pipe(
                    filter(x => x && this.form.dirty),
                    withLatestFrom(
                        this.distinctPreismeldung$.pipe(map(x => x.refPreismeldung)),
                        (_, refPreismeldung) => refPreismeldung,
                    ),
                )
                .subscribe(refPreismeldung => {
                    this.form.patchValue({
                        preis: `${preisFormatFn(refPreismeldung.preis)}`,
                        menge: `${refPreismeldung.menge}`,
                        aktion: refPreismeldung.aktion,
                    });
                }),
        );

        this.subscriptions.push(
            bearbeitungscodeChanged$
                .pipe(
                    map(x => x === 3),
                    filter(x => x),
                )
                .subscribe(() => {
                    this.form.patchValue({
                        aktion: false,
                    });
                }),
        );

        this.subscriptions.push(
            this.preisAndMengeDisabled$
                .pipe(
                    distinctUntilChanged(),
                    filter(x => !x && this.form.dirty),
                )
                .subscribe(() => {
                    this.form.patchValue({
                        preis: '',
                        menge: '',
                        aktion: false,
                    });
                }),
        );

        const canSave$ = this.attemptSave$.pipe(
            mapTo({ type: 'JUST_SAVE' } as P.SavePreismeldungPriceSaveAction),
            merge(this.requestPreismeldungSave$),
            withLatestFrom(this.isSaveDisabled$, (saveAction, isSaveDisabled) => ({ saveAction, isSaveDisabled })),
            filter(x => !x.isSaveDisabled),
            map(({ saveAction }) => ({ saveAction, isValid: this.form.valid })),
            publishReplay(1),
            refCount(),
        );

        const saveWithBag$ = canSave$.pipe(
            filter(x => x.isValid),
            map(x => x.saveAction),
            withLatestFrom(this.preismeldung$, (saveAction, bag) => ({ saveAction, bag })),
            publishReplay(1),
            refCount(),
        );

        this.subscriptions.push(
            saveWithBag$
                .pipe(
                    filter(x => x.bag.hasAttributeWarning),
                    mergeMap(() =>
                        pefDialogService.displayDialog(PefDialogValidationErrorsComponent, {
                            params: { errorMessages: translateService.instant('validation_produktMerkmale_erfassen') },
                            dialogOptions: { backdropDismiss: true },
                        }),
                    ),
                )
                .subscribe(),
        );

        const saveLogic$ = saveWithBag$.pipe(
            withLatestFrom(this.isAdminApp$.pipe(startWith(false)), (x, isAdminApp) => assign({}, x, { isAdminApp })),
            filter(x => !x.bag.hasAttributeWarning),
            mergeMap(({ saveAction, bag, isAdminApp }) => {
                const alerts: {
                    condition: () => boolean;
                    observable: () => Observable<P.SavePreismeldungPriceSaveAction>;
                }[] = [
                    {
                        condition: () =>
                            !isAdminApp &&
                            !!bag.refPreismeldung &&
                            !!bag.refPreismeldung.bemerkungen &&
                            bag.messages.bemerkungen === '',
                        observable: () =>
                            pefDialogService
                                .displayDialog(PefDialogValidationErrorsComponent, {
                                    params: { errorMessages: translateService.instant('validation_frage-antworten') },
                                    dialogOptions: { backdropDismiss: true },
                                })
                                .pipe(
                                    map(
                                        () =>
                                            ({
                                                type: 'NO_SAVE_NAVIGATE',
                                                tabName: 'MESSAGES',
                                            } as P.SavePreismeldungPriceSaveAction),
                                    ),
                                ),
                    },
                    {
                        condition: () => !isAdminApp && bag.hasPriceWarning,
                        observable: () =>
                            observableIif(
                                () => !bag.messages.kommentar,
                                defer(() =>
                                    pefMessageDialogService.displayMessageDialog(
                                        [
                                            { textKey: 'btn_yes', dismissValue: 'YES' },
                                            { textKey: 'btn_verwerfen', dismissValue: 'THROW_CHANGES' },
                                            { textKey: 'btn_edit-comment', dismissValue: 'EDIT' },
                                        ],
                                        'dialogText_abnormal-preisentwicklung',
                                    ),
                                ),
                                // Always write autotext for "hasPriceWarning" https://github.com/Lambda-IT/lik-studio/issues/339
                                observableOf({ data: 'YES' }),
                            ).pipe(
                                map(res => {
                                    switch (res.data) {
                                        case 'YES':
                                            return {
                                                type: saveAction.type,
                                                saveWithData: [
                                                    {
                                                        type: 'COMMENT',
                                                        comments: [
                                                            'kommentar-autotext_abnormale-preisentwicklung-bestaetigt',
                                                        ],
                                                    },
                                                ],
                                            };
                                        case 'THROW_CHANGES':
                                            return 'THROW_CHANGES';
                                        case 'EDIT':
                                            return { type: 'CANCEL' };
                                    }
                                }),
                            ) as any, // TODO FIX TYPINGS,
                    },
                    {
                        condition: () =>
                            !isAdminApp &&
                            [1, 7].some(code => code === this.form.value.bearbeitungscode) &&
                            bag.refPreismeldung.artikeltext === this.form.value.artikeltext &&
                            bag.refPreismeldung.artikelnummer === this.form.value.artikelnummer,
                        observable: () =>
                            pefMessageDialogService.displayDialogYesNo('dialogText_unveraendert-pm-text').pipe(
                                map(res =>
                                    res.data === 'YES'
                                        ? {
                                              type: saveAction.type,
                                              saveWithData: [
                                                  {
                                                      type: 'COMMENT',
                                                      comments: [
                                                          'kommentar-autotext_artikeltext-unveraendert-bestaetigt',
                                                      ],
                                                  },
                                              ],
                                          }
                                        : { type: 'CANCEL' },
                                ),
                            ),
                    },
                    {
                        // Issue #94
                        // Codes 99, 1
                        // Falls mehrmals hintereinander A gesetzt wird, kann Preis theoretisch höher, gleich oder unter VP-Meldung liegen. Normalfall ist im Ausverkauf jedoch, dass die „Aktion“ unverändert oder tiefer als VP zu liegen kommt.
                        // -> Falls Aktionspreis/ Menge in T über VP: Warnmeldung im Sinne von „Ist der Preis noch in Aktion ? Bitte überprüfen und [zurück zur Eingabe] / [verwerfen] / [bestätigen]“.
                        condition: () =>
                            !isAdminApp &&
                            [99, 1].some(x => x === this.form.value.bearbeitungscode) &&
                            this.form.value.aktion &&
                            bag.refPreismeldung.aktion &&
                            bag.preismeldung.d_DPToVP.percentage > 0,
                        observable: () =>
                            pefMessageDialogService
                                .displayDialogYesNoEdit('dialogText_aktion-message-preis-hoeher')
                                .pipe(
                                    map(res =>
                                        res.data === 'EDIT'
                                            ? { type: 'CANCEL' }
                                            : res.data === 'YES'
                                            ? {
                                                  type: saveAction.type,
                                                  saveWithData: [
                                                      {
                                                          type: 'COMMENT',
                                                          comments: [
                                                              'kommentar-autotext_steigender-aktionspreis-bestaetigt',
                                                          ],
                                                      },
                                                  ],
                                              }
                                            : {
                                                  type: saveAction.type,
                                                  saveWithData: [{ type: 'AKTION', value: false }],
                                              },
                                    ),
                                ),
                    },
                    {
                        // Issue #94
                        // Codes 99, 1
                        // Falls Preis/Menge in T gleich/kleiner Aktionspreis/Menge VP, jedoch kein Flag A in T gesetzt ist, Message: „Ist Artikel aktuell in Aktion?“
                        // [JA](Flag A in T schreiben/Speichern/Forward) / [NEIN](Bemerkung: „Nicht mehr Aktion bei unverändertem Preis“/Speichern/Forward)
                        condition: () =>
                            !isAdminApp &&
                            [99, 1].some(x => x === this.form.value.bearbeitungscode) &&
                            !this.form.value.aktion &&
                            !!bag.refPreismeldung &&
                            bag.refPreismeldung.aktion &&
                            bag.preismeldung.d_DPToVP.percentage <= 0,
                        observable: () =>
                            pefMessageDialogService
                                .displayDialogYesNoEdit(
                                    'dialogText_vp_aktionspreis-gleich-hoeher-aktueller-normalpreis',
                                )
                                .pipe(
                                    map(res =>
                                        res.data === 'EDIT'
                                            ? { type: 'CANCEL' }
                                            : res.data === 'YES'
                                            ? {
                                                  type: saveAction.type,
                                                  saveWithData: [{ type: 'AKTION', value: true }],
                                              }
                                            : {
                                                  type: saveAction.type,
                                                  saveWithData: [
                                                      {
                                                          type: 'COMMENT',
                                                          comments: [
                                                              'kommentar-autotext_aktueller-normalpreis-billiger-aktionspreis_vp',
                                                          ],
                                                      },
                                                  ],
                                              },
                                    ),
                                ),
                    },
                    {
                        // Issue #94
                        // Codes 99, 1, 77
                        // Falls Aktionspreis/Menge in T grösser/gleich Preis/Menge VP, jedoch kein Aktionsflag in VP gesetzt ist, Dialog öffnen: „Aktueller Aktionspreis ist gleich oder grösser als Normalpreis in VP. Stimmt der erfasste Preis?“ mit [JA]
                        // -> autotext / [EDIT] / [Kommentar] -> falls möglich direkt zu Kommentarfeld wechseln (oder falls aufwändig zurück zur normalen Maske, also EDIT)
                        condition: () =>
                            !isAdminApp &&
                            [99, 1].some(x => x === this.form.value.bearbeitungscode) &&
                            this.form.value.aktion &&
                            !!bag.refPreismeldung &&
                            !bag.refPreismeldung.aktion &&
                            bag.preismeldung.d_DPToVP.percentage >= 0,
                        observable: () =>
                            pefMessageDialogService
                                .displayMessageDialog(
                                    [
                                        { textKey: 'btn_yes', dismissValue: 'YES' },
                                        { textKey: 'btn_edit', dismissValue: 'EDIT' },
                                        { textKey: 'btn_comment', dismissValue: 'COMMENT' },
                                    ],
                                    'dialogText_aktueller-aktionspreis-gleich-groesser-vp-normalpreis',
                                )
                                .pipe(
                                    map(res =>
                                        res.data === 'EDIT'
                                            ? { type: 'CANCEL' }
                                            : res.data === 'YES'
                                            ? {
                                                  type: saveAction.type,
                                                  saveWithData: [
                                                      {
                                                          type: 'COMMENT',
                                                          comments: [
                                                              'kommentar-autotext_aktueller-aktionspreis-teuerer-normalpreis-vp',
                                                          ],
                                                      },
                                                  ],
                                              }
                                            : {
                                                  type: 'SAVE_AND_NAVIGATE_TAB',
                                                  saveWithData: [{ type: 'COMMENT', comments: [] }],
                                                  tabName: 'MESSAGES',
                                              },
                                    ),
                                ),
                    },
                    {
                        // Issue #151
                        // Code 2
                        // Falls Aktionspreis/Menge in T grösser/gleich Preis/Menge VPK, Dialog öffnen: „Aktueller Aktionspreis ist gleich oder grösser als Normalpreis in VP. Stimmt der erfasste Preis?“ mit [JA]
                        // -> autotext / [EDIT] / [Kommentar] -> falls möglich direkt zu Kommentarfeld wechseln (oder falls aufwändig zurück zur normalen Maske, also EDIT)
                        condition: () =>
                            !isAdminApp &&
                            [2, 7].some(x => x === this.form.value.bearbeitungscode) &&
                            this.form.value.aktion &&
                            bag.preismeldung.d_DPToVPK.percentage >= 0,
                        observable: () =>
                            pefMessageDialogService
                                .displayMessageDialog(
                                    [
                                        { textKey: 'btn_yes', dismissValue: 'YES' },
                                        { textKey: 'btn_edit', dismissValue: 'EDIT' },
                                        { textKey: 'btn_comment', dismissValue: 'COMMENT' },
                                    ],
                                    'dialogText_aktueller-aktionspreis-gleich-groesser-vp-normalpreis',
                                )
                                .pipe(
                                    map(res =>
                                        res.data === 'EDIT'
                                            ? { type: 'CANCEL' }
                                            : res.data === 'YES'
                                            ? {
                                                  type: saveAction.type,
                                                  saveWithData: [
                                                      {
                                                          type: 'COMMENT',
                                                          comments: [
                                                              'kommentar-autotext_aktueller-aktionspreis-teuerer-normalpreis-vp',
                                                          ],
                                                      },
                                                  ],
                                              }
                                            : {
                                                  type: 'SAVE_AND_NAVIGATE_TAB',
                                                  saveWithData: [{ type: 'COMMENT', comments: [] }],
                                                  tabName: 'MESSAGES',
                                              },
                                    ),
                                ),
                    },
                    {
                        condition: () =>
                            !isAdminApp &&
                            this.form.value.bearbeitungscode === 101 &&
                            /^R+$/.exec(bag.refPreismeldung.fehlendePreiseR) &&
                            bag.refPreismeldung.fehlendePreiseR.length >= 2,
                        observable: () =>
                            pefMessageDialogService
                                .displayDialogYesNo('dialogText_rrr-message-mit-aufforderung-zu-produktersatz')
                                .pipe(
                                    map(res =>
                                        res.data === 'YES'
                                            ? { type: 'CANCEL' }
                                            : {
                                                  type: saveAction.type,
                                                  saveWithData: [
                                                      {
                                                          type: 'COMMENT',
                                                          comments: ['kommentar-autotext_keine-ersatzprodukte'],
                                                      },
                                                  ],
                                              },
                                    ),
                                ),
                    },
                    {
                        condition: () =>
                            !isAdminApp &&
                            this.form.value.bearbeitungscode === 0 &&
                            bag.priceCountStatus.numActivePrices < bag.priceCountStatus.anzahlPreiseProPMS,
                        observable: () => {
                            const params = {
                                numActivePrices: bag.priceCountStatus.numActivePrices,
                                anzahlPreiseProPMS: bag.priceCountStatus.anzahlPreiseProPMS,
                            };
                            return pefMessageDialogService
                                .displayDialogYesNo('dialogText_aufforderung-ersatzsuche', params)
                                .pipe(
                                    map(res =>
                                        res.data === 'YES'
                                            ? {
                                                  type: 'SAVE_AND_DUPLICATE_PREISMELDUNG',
                                                  saveWithData: [{ type: 'COMMENT', comments: [] }],
                                              }
                                            : {
                                                  type: saveAction.type,
                                                  saveWithData: [
                                                      {
                                                          type: 'COMMENT',
                                                          comments: ['kommentar-autotext_keine-produkte'],
                                                      },
                                                  ],
                                              },
                                    ),
                                );
                        },
                    },
                ];

                const alertsToExecute = alerts.filter(x => x.condition()).map(x => x.observable);

                return alertsToExecute.length > 0
                    ? (alertsToExecute.reduce((agg, v) => {
                          if (!agg) return v().pipe(map(save => ({ ...saveActionData(saveAction), ...save })));
                          return (agg as any).pipe(
                              mergeMap((lastAlertResult: any) => {
                                  if (
                                      lastAlertResult === 'THROW_CHANGES' ||
                                      ['CANCEL', 'NO_SAVE_NAVIGATE'].some(x => x === lastAlertResult.type)
                                  )
                                      return observableOf(lastAlertResult);
                                  return v().pipe(
                                      map(thisAlertResult => {
                                          if (
                                              P.isSavePreismeldungPriceSaveActionSave(lastAlertResult) &&
                                              P.isSavePreismeldungPriceSaveActionSave(thisAlertResult)
                                          ) {
                                              return {
                                                  ...saveActionData(saveAction),
                                                  ...thisAlertResult,
                                                  saveWithData: (thisAlertResult as P.SavePreismeldungPriceSaveActionSave).saveWithData.concat(
                                                      lastAlertResult.saveWithData,
                                                  ),
                                              };
                                          } else {
                                              return { ...saveActionData(saveAction), ...thisAlertResult };
                                          }
                                      }),
                                  );
                              }),
                          );
                      }, null) as Observable<P.SavePreismeldungPriceSaveAction | string>)
                    : observableOf({
                          ...saveActionData(saveAction),
                          type: saveAction.type,
                          saveWithData: [{ type: 'COMMENT', comments: [] }],
                      } as P.SavePreismeldungPriceSaveAction | string);
            }),
            publishReplay(1),
            refCount(),
        );

        this.save$ = saveLogic$.pipe(
            filter(x => x !== 'THROW_CHANGES' && (x as P.SavePreismeldungPriceSaveAction).type !== 'CANCEL'),
        );
        this.requestThrowChanges$ = saveLogic$.pipe(
            filter(x => x === 'THROW_CHANGES'),
            mapTo({}),
        );

        this.showValidationHints$ = canSave$.pipe(
            distinctUntilChanged(),
            mapTo(true),
            merge(this.distinctPreismeldung$.pipe(mapTo(false))),
        );

        this.subscriptions.push(
            canSave$
                .pipe(
                    filter(x => !x.isValid),
                    map(() =>
                        keys(this.form.controls)
                            .filter(x => !!this.form.controls[x].errors)
                            .map(controlName => {
                                const control = this.form.controls[controlName];
                                const errorKey = keys(control.errors)[0];
                                const errorParams = assign({}, control.errors[errorKey], {
                                    controlName: translateService.instant(`control_${controlName}`),
                                });
                                return translateService.instant(`validation_formatted_${errorKey}`, errorParams);
                            }),
                    ),
                    mergeMap(errorMessages =>
                        pefDialogService.displayDialog(PefDialogValidationErrorsComponent, {
                            params: { errorMessages },
                            dialogOptions: { backdropDismiss: true },
                        }),
                    ),
                )
                .subscribe(),
        );

        this.currentPeriodHeading$ = this.changeBearbeitungscode$.pipe(
            merge(this.distinctPreismeldung$.pipe(map(x => x.preismeldung.bearbeitungscode))),
            combineLatest(infoPopoverRightActive$, (bearbeitungscode, infoPopoverRightActive) => {
                if (infoPopoverRightActive) {
                    return 'heading_artikel-ausser-aktion';
                }
                return [7, 2, 3].some(x => x === bearbeitungscode) ? 'heading_artikel-neu' : 'heading_artikel';
            }),
        );

        const showInvalid$ = this.form.valueChanges.pipe(merge(this.attemptSave$)).pipe(
            publishReplay(1),
            refCount(),
        );
        this.createInvalidObservableFor = (controlName: string) =>
            showInvalid$.pipe(map(() => !!this.form.controls[controlName].errors));

        this.arrowDown$ = infoPopoverLeftActive$.pipe(
            combineLatest(this.preismeldung$, (infoPopoverLeftActive, bag) => ({ infoPopoverLeftActive, bag })),
            filter(x => !!x.bag),
            map(x =>
                x.infoPopoverLeftActive
                    ? x.bag.preismeldung.d_VPKToVPVorReduktion
                    : x.bag.preismeldung.d_VPKToVPAlterArtikel,
            ),
            publishReplay(1),
            refCount(),
        );

        this.arrowRight$ = this.preismeldung$.pipe(
            combineLatest(
                infoPopoverLeftActive$,
                infoPopoverRightActive$,
                (bag, infoPopoverLeftActive, infoPopoverRightActive) => ({
                    bag,
                    infoPopoverLeftActive,
                    infoPopoverRightActive,
                }),
            ),
            filter(x => !!x.bag),
            map(x => {
                if (x.infoPopoverLeftActive && x.infoPopoverRightActive)
                    return x.bag.preismeldung.d_DPVorReduktionToVPVorReduktion;
                if (!x.infoPopoverLeftActive && x.infoPopoverRightActive)
                    return x.bag.preismeldung.d_DPVorReduktionToVP;
                if (x.infoPopoverLeftActive && !x.infoPopoverRightActive)
                    return x.bag.preismeldung.d_DPToVPVorReduktion;
                return x.bag.preismeldung.d_DPToVP;
            }),
            publishReplay(1),
            refCount(),
        );
    }

    calcPreisAndMengeDisabled(bearbeitungscode: P.Models.Bearbeitungscode) {
        return [0, 44, 101].some(x => x === bearbeitungscode);
    }

    formatPercentageChange = percentageChange => formatPercentageChange(percentageChange, 1);

    formatFehlendePreiseR(fehlendePreiseR: string) {
        if (!/.^R*$/.exec(fehlendePreiseR)) return fehlendePreiseR;
        return fehlendePreiseR.length >= 4 ? `R${fehlendePreiseR.length}` : fehlendePreiseR;
    }

    isInternet(erhebungsart: string) {
        const _erhebungsart = parseErhebungsarten(erhebungsart);
        return _erhebungsart.internet;
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    formLevelValidationFactory() {
        return (group: FormGroup) => {
            const bearbeitungscode = group.get('bearbeitungscode');
            const aktion = group.get('aktion');
            if (!![2, 7].some(x => x === bearbeitungscode.value)) {
                const preisVPK = group.get('preisVPK');
                preisVPK.setErrors(
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 4 }),
                    ])(preisVPK),
                );
                const mengeVPK = group.get('mengeVPK');
                mengeVPK.setErrors(
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 9999999.99, { padRight: 2, truncate: 2 }),
                    ])(mengeVPK),
                );
            } else if (bearbeitungscode.value === 1 && !!aktion.value) {
                const preisVorReduktion = group.get('preisVorReduktion');
                preisVorReduktion.setErrors(
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 4 }),
                    ])(preisVorReduktion),
                );
                const mengeVorReduktion = group.get('mengeVorReduktion');
                mengeVorReduktion.setErrors(
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 9999999.99, { padRight: 2, truncate: 2 }),
                    ])(mengeVorReduktion),
                );
            }
        };
    }

    navigateToInternetLink(internetLink: string) {
        if (!internetLink) return;

        let _internetLink = internetLink;
        if (!internetLink.startsWith('http://') && !internetLink.startsWith('https://')) {
            _internetLink = `http://${internetLink}`;
        }
        if (this.isDesktop) {
            this.electronService.shell.openExternal(_internetLink);
        } else {
            this.wndw.open(_internetLink, '_blank');
        }
    }
}

function saveActionData(saveAction: P.SavePreismeldungPriceSaveAction) {
    switch (saveAction.type) {
        case 'SAVE_AND_MOVE_TO_NEXT':
            return { nextId: saveAction.nextId };
        default:
            return {};
    }
}
