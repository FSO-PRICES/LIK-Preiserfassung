/*
 * LIK-Preiserfassung
 * Copyright (C) 2024 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */
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
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { isNotNil } from 'libs/lik-shared/src/lib/common/nil';
import { assign, keys } from 'lodash';
import { WINDOW } from 'ngx-window-token';
import {
    Observable,
    Subscription,
    combineLatest as combineLatestFn,
    defer,
    merge as mergeFn,
    iif as observableIif,
    of as observableOf,
    of,
} from 'rxjs';
import {
    combineLatest,
    distinctUntilChanged,
    distinctUntilKeyChanged,
    filter,
    map,
    mapTo,
    merge,
    mergeMap,
    mergeWith,
    publishReplay,
    refCount,
    shareReplay,
    startWith,
    switchMap,
    tap,
    withLatestFrom,
} from 'rxjs/operators';

import {
    PefDialogService,
    PefMessageDialogService,
    ReactiveComponent,
    formatPercentageChange,
    maxMinNumberValidatorFactory,
    mengeFormatFn,
    mengeNumberFormattingOptions,
    parseErhebungsarten,
    preisFormatFn,
    preisNumberFormattingOptions,
} from '../../../../common';
import { PefDialogValidationErrorsComponent } from '../../../../pef-components';
import * as P from '../../../models';
import { ElectronService } from '../../../services';
import { CodeListType } from '../../bearbeitungs-type/bearbeitungs-type';
import {
    DialogChoosePercentageReductionComponent,
    DialogChoosePercentageReductionResult,
} from '../../dialog-choose-percentage-reduction/dialog-choose-percentage-reduction';

@Component({
    selector: 'preismeldung-price',
    styleUrls: ['./preismeldung-price.scss'],
    templateUrl: 'preismeldung-price.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungPriceComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input({ required: true }) preismeldung!: P.CurrentPreismeldungViewBag;
    @Input({ required: true }) preismeldestelle!: P.Models.Preismeldestelle;
    @Input({ required: true }) isAdminApp!: boolean;
    @Input({ required: true }) requestPreismeldungSave!: P.SavePreismeldungPriceSaveAction;
    @Input({ required: true }) requestPreismeldungQuickEqual!: Date;
    @Input({ required: true }) isDesktop!: boolean;
    @Input({ required: true }) hasWritePermission!: boolean;
    @Input({ required: false }) currentPreismeldungHasStatus!: boolean;
    @Output('preismeldungPricePayload') preismeldungPricePayload$: Observable<P.PreismeldungPricePayload>;
    @Output('save') save$: Observable<P.SavePreismeldungPriceSaveAction>;
    @Output('duplicatePreismeldung') duplicatePreismeldung$ = new EventEmitter();
    @Output('requestSelectNextPreismeldung') requestSelectNextPreismeldung$ = new EventEmitter<{}>();
    @Output('cancel') cancel$ = new EventEmitter();
    @Output('requestThrowChanges') requestThrowChanges$: Observable<{}>;
    @Output('isSaveLookDisabled') public isSaveLookDisabled$: Observable<boolean>;
    @Output('disableQuickEqual') disableQuickEqual$: Observable<boolean>;
    @Output('setStichtag') setStichtag$: Observable<number>;

    public isReadonly$: Observable<boolean>;

    public preismeldung$: Observable<P.CurrentPreismeldungViewBag>;
    public distinctPreismeldung$: Observable<P.CurrentPreismeldungViewBag>;
    public requestPreismeldungSave$: Observable<P.SavePreismeldungPriceSaveAction>;
    public requestPreismeldungQuickEqual$: Observable<string>;
    public stichtagSettings$: Observable<{ values: number[] } | null>;
    public currentStichtag$: Observable<string>;
    public codeListType$: Observable<CodeListType>;

    public changeBearbeitungscode$ = new EventEmitter<P.Models.Bearbeitungscode>();
    public setStichtagClicked$ = new EventEmitter<number>();
    public preisAndMengeDisabled$: Observable<boolean>;
    public aktionDisabled$: Observable<boolean>;
    public showVPArtikelNeu$: Observable<boolean>;
    public selectedProcessingCode$ = new EventEmitter<any>();

    public preisChanged$ = new EventEmitter<string | number>();
    public preisCurrentValue$: Observable<{ value: string }>;
    public mengeChanged$ = new EventEmitter<string | number>();
    public preisVorReduktionChanged$ = new EventEmitter<string | number>();
    public mengeVorReduktionChanged$ = new EventEmitter<string | number>();
    public createInvalidObservableFor: (controlName: string) => Observable<boolean>;

    public preisVPKChanged$ = new EventEmitter<string | number>();
    public preisVPKCurrentValue$: Observable<{ value: string }>;
    public mengeVPKChanged$ = new EventEmitter<string | number>();

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
    public vpPriceWarning$: Observable<boolean>;
    public dpPriceWarning$: Observable<boolean>;

    public currentPeriodHeading$: Observable<string>;
    public isSaveDisabled$: Observable<boolean>;
    public isNew$: Observable<boolean>;

    public isInternet$: Observable<boolean>;

    public preisInput$ = new EventEmitter<string>();
    public mengeInput$ = new EventEmitter<string>();
    public preisVorReduktionInput$ = new EventEmitter<string>();
    public mengeVorReduktionInput$ = new EventEmitter<string>();

    priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle');
    isDesktop$ = this.observePropertyCurrentValue<boolean>('isDesktop');
    isAdminApp$ = this.observePropertyCurrentValue<boolean>('isAdminApp').pipe(
        startWith(false),
        publishReplay(1),
        refCount(),
    );
    hasWritePermission$ = this.observePropertyCurrentValue<boolean>('hasWritePermission');

    form: UntypedFormGroup;

    private subscriptions: Subscription[] = [];

    constructor(
        formBuilder: UntypedFormBuilder,
        pefDialogService: PefDialogService,
        pefMessageDialogService: PefMessageDialogService,
        translateService: TranslateService,
        @Inject(WINDOW) public wndw: Window,
        private electronService: ElectronService,
    ) {
        super();

        const infoPopoverLeftActive$ = this.infoPopoverLeftActive$.pipe(startWith(false), publishReplay(1), refCount());
        const infoPopoverRightActive$ = this.infoPopoverRightActive$.pipe(
            startWith(false),
            publishReplay(1),
            refCount(),
        );

        this.preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungViewBag>('preismeldung').pipe(
            publishReplay(1),
            refCount(),
        );

        this.disableQuickEqual$ = infoPopoverRightActive$;

        this.subscriptions.push(
            this.preisChanged$.subscribe((x) =>
                this.form.patchValue({ preis: `${x !== '' ? preisFormatFn(+x) : ''}` }),
            ),
        );
        this.subscriptions.push(
            this.mengeChanged$.subscribe((x) =>
                this.form.patchValue({ menge: `${x !== '' ? mengeFormatFn(+x) : ''}` }),
            ),
        );
        this.subscriptions.push(
            this.preisVorReduktionChanged$.subscribe((x) =>
                this.form.patchValue({ preisVorReduktion: `${x !== '' ? preisFormatFn(+x) : ''}` }),
            ),
        );
        this.subscriptions.push(
            this.mengeVorReduktionChanged$.subscribe((x) =>
                this.form.patchValue({ mengeVorReduktion: `${x !== '' ? mengeFormatFn(+x) : ''}` }),
            ),
        );
        this.subscriptions.push(
            this.preisVPKChanged$.subscribe((x) =>
                this.form.patchValue({ preisVPK: `${x !== '' ? preisFormatFn(+x) : ''}` }),
            ),
        );
        this.subscriptions.push(
            this.mengeVPKChanged$.subscribe((x) =>
                this.form.patchValue({ mengeVPK: `${x !== '' ? mengeFormatFn(+x) : ''}` }),
            ),
        );
        this.subscriptions.push(
            this.preismeldung$
                .pipe(
                    filter((x) => !!x),
                    map(({ preismeldung: { artikeltext } }) => artikeltext),
                    distinctUntilChanged(),
                )
                .subscribe((artikelText) => this.form.patchValue({ artikeltext: artikelText }, { emitEvent: false })),
        );

        this.isInternet$ = this.preismeldestelle$.pipe(map((p) => !!p && this.isInternet(p.erhebungsart)));

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

        this.requestPreismeldungSave$ = this.observePropertyCurrentValue<P.SavePreismeldungPriceSaveAction>(
            'requestPreismeldungSave',
        ).pipe(filter((x) => !!x));
        this.requestPreismeldungQuickEqual$ = this.observePropertyCurrentValue<string>(
            'requestPreismeldungQuickEqual',
        ).pipe(filter((x) => !!x));

        this.distinctPreismeldung$ = this.preismeldung$.pipe(
            filter((x) => !!x),
            distinctUntilChanged((x, y) => x.pmId === y.pmId && x.resetEvent === y.resetEvent),
            publishReplay(1),
            refCount(),
        );

        this.stichtagSettings$ = this.preismeldung$.pipe(
            filter((x) => !!x),
            distinctUntilKeyChanged('isNew'),
            switchMap((bag) =>
                !bag.isNew
                    ? of(null)
                    : of(bag.warenkorbPosition.erhebungszeitpunkte).pipe(
                          filter((zeitpunkt) => zeitpunkt !== 0),
                          map((zeitpunkt) => ({ 1: { values: [1, 2] }, 10: { values: [10, 20] } }[zeitpunkt] || null)),
                          filter((x) => x !== null),
                          withLatestFrom(this.isAdminApp$),
                          filter(([, isAdminApp]) => !isAdminApp),
                          map(([stichtag]) => stichtag),
                      ),
            ),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
        this.currentStichtag$ = this.preismeldung$.pipe(
            map((bag) =>
                !bag || !bag.preismeldung.erhebungsZeitpunkt
                    ? '#'
                    : bag.preismeldung.erhebungsZeitpunkt == 99
                    ? '#'
                    : bag.preismeldung.erhebungsZeitpunkt.toString(),
            ),
        );
        this.setStichtag$ = this.setStichtagClicked$.pipe(
            withLatestFrom(this.stichtagSettings$, this.preismeldung$),
            map(([, { values }, bag]) => {
                const next = values.indexOf(bag.preismeldung.erhebungsZeitpunkt) + 1;
                return values[next > values.length - 1 ? 0 : next];
            }),
        );

        this.preisCurrentValue$ = mergeFn(
            this.form.valueChanges.pipe(map(() => this.form.value.preis)),
            this.distinctPreismeldung$.pipe(map((x) => x.preismeldung.preis)),
        ).pipe(map((x) => ({ value: `${x === '' ? '' : preisFormatFn(+x)}` })));

        this.subscriptions.push(this.preisCurrentValue$.subscribe());

        this.preisVPKCurrentValue$ = mergeFn(
            this.form.valueChanges.pipe(map(() => this.form.value.preisVPK)),
            this.distinctPreismeldung$.pipe(map((x) => x.preismeldung.preisVPK)),
        ).pipe(map((x) => ({ value: `${x === '' ? '' : preisFormatFn(+x)}` })));

        this.isNew$ = this.preismeldung$.pipe(
            filter((x) => !!x),
            map((bag) => !bag.refPreismeldung && !bag.preismeldung.erfasstAt),
        );

        this.closePopoverRight$ = this.distinctPreismeldung$.pipe(
            merge(
                this.preismeldung$.pipe(
                    filter((x) => !!x && !x.preismeldung.aktion),
                    map(() => ({})),
                ),
            ),
        );

        this.subscriptions.push(
            this.distinctPreismeldung$.subscribe((bag) => {
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
            this.preismeldung$.pipe(filter((x) => !!x)).subscribe((preismeldung) => {
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
                .subscribe((currentPm) => {
                    this.form.patchValue({
                        preis: `${currentPm.refPreismeldung ? preisFormatFn(currentPm.refPreismeldung.preis) : ''}`,
                        menge: `${currentPm.refPreismeldung ? mengeFormatFn(+currentPm.refPreismeldung.menge) : ''}`,
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
                                    ? mengeFormatFn(+preismeldung.refPreismeldung.menge)
                                    : mengeFormatFn(+preismeldung.warenkorbPosition.standardmenge)
                            }`,
                        });
                    } else {
                        this.form.patchValue({
                            mengeVorReduktion: `${
                                preismeldung.refPreismeldung
                                    ? mengeFormatFn(+preismeldung.refPreismeldung.menge)
                                    : mengeFormatFn(+preismeldung.warenkorbPosition.standardmenge)
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
                .subscribe((preismeldung) => {
                    this.form.patchValue({
                        mengeVPK: `${
                            preismeldung.refPreismeldung
                                ? mengeFormatFn(+preismeldung.refPreismeldung.menge)
                                : mengeFormatFn(+preismeldung.warenkorbPosition.standardmenge)
                        }`,
                    });
                }),
        );

        this.subscriptions.push(
            this.toggleAktion$.subscribe((newAktionValue) => {
                this.form.patchValue({
                    aktion: newAktionValue,
                });
            }),
        );

        const bearbeitungscodeChanged$ = this.changeBearbeitungscode$
            .pipe(merge(this.distinctPreismeldung$.pipe(map((x) => x.preismeldung.bearbeitungscode))))
            .pipe(publishReplay(1), refCount());

        this.subscriptions.push(
            this.toggleAktion$
                .pipe(
                    combineLatest(bearbeitungscodeChanged$, (newAktionValue, bearbeitungscode) => ({
                        newAktionValue,
                        bearbeitungscode,
                    })),
                )
                .subscribe((x) => {
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
                    mergeMap(() => pefDialogService.displayDialog(DialogChoosePercentageReductionComponent)),
                    filter(isNotNil),
                    filter(DialogChoosePercentageReductionResult.is.Ok),
                )
                .subscribe(({ percentage }) => {
                    const currentPreis = parseFloat(this.form.value.preis);
                    if (isNaN(currentPreis)) return;
                    this.form.patchValue({
                        preis: `${(currentPreis - currentPreis * (percentage / 100)).toFixed(2)}`,
                    });
                }),
        );

        this.subscriptions.push(
            this.hasWritePermission$.pipe(distinctUntilChanged()).subscribe((hasWritePermission) => {
                if (hasWritePermission) {
                    this.form.enable({ emitEvent: false });
                } else {
                    this.form.disable({ emitEvent: false });
                }
            }),
        );

        this.codeListType$ = this.distinctPreismeldung$.pipe(
            map((x) =>
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

        this.isReadonly$ = combineLatestFn([this.distinctPreismeldung$, this.isAdminApp$]).pipe(
            map(([distinctPm, isAdminApp]) => {
                return distinctPm.isReadonly || (isAdminApp && !this.currentPreismeldungHasStatus);
            }),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.isSaveDisabled$ = this.preismeldung$.pipe(
            filter((x) => !!x),
            combineLatest(this.isReadonly$, (bag, isReadonly) => !bag.isModified || isReadonly),
            distinctUntilChanged(),
            publishReplay(1),
            refCount(),
        );

        const hasChanged = (
            input$: Observable<string>,
            changed$: Observable<string>,
            selector: (bag: P.CurrentPreismeldungViewBag) => string | undefined,
        ) =>
            input$.pipe(
                withLatestFrom(
                    changed$.pipe(
                        merge(
                            this.preismeldung$.pipe(
                                filter((x) => !!x),
                                map(selector),
                            ),
                        ),
                    ),
                    (i, c) => +i === (c == null ? NaN : +c),
                ),
            );

        this.isSaveLookDisabled$ = this.distinctPreismeldung$.pipe(
            combineLatest(
                hasChanged(
                    this.preisInput$,
                    this.preisChanged$.pipe(map(String)),
                    (bag) => bag.preismeldung.preis,
                ).pipe(
                    merge(
                        hasChanged(
                            this.mengeInput$,
                            this.mengeChanged$.pipe(map(String)),
                            (bag) => bag.preismeldung.menge,
                        ),
                        hasChanged(
                            this.preisVorReduktionInput$,
                            this.preisVorReduktionChanged$.pipe(map(String)),
                            (bag) => bag.preismeldung.preisVorReduktion,
                        ),
                        hasChanged(
                            this.mengeVorReduktionInput$,
                            this.mengeVorReduktionChanged$.pipe(map(String)),
                            (bag) => bag.preismeldung.mengeVorReduktion,
                        ),
                        this.preismeldung$.pipe(
                            filter((x) => !!x),
                            map((x) => x.isModified),
                            distinctUntilChanged(),
                            map((x) => !x),
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
            map((x) => this.calcPreisAndMengeDisabled(x)),
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

        this.showVPArtikelNeu$ = bearbeitungscodeChanged$
            .pipe(map((x) => x === 7 || x === 2))
            .pipe(publishReplay(1), refCount());

        this.subscriptions.push(
            this.showVPArtikelNeu$.pipe(filter((x) => !x && this.form.dirty)).subscribe(() => {
                this.form.patchValue({
                    preisVPK: '',
                    mengeVPK: '',
                });
            }),
        );

        this.subscriptions.push(
            this.preisAndMengeDisabled$
                .pipe(
                    filter((x) => x && this.form.dirty),
                    withLatestFrom(
                        this.distinctPreismeldung$.pipe(map((x) => x.refPreismeldung)),
                        (_, refPreismeldung) => refPreismeldung,
                    ),
                )
                .subscribe((refPreismeldung) => {
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
                    map((x) => x === 3),
                    filter((x) => x),
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
                    filter((x) => !x && this.form.dirty),
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
            withLatestFrom(this.hasWritePermission$),
            tap(([, hasWritePermission]) => {
                if (!hasWritePermission) {
                    alert(translateService.instant('exceptions.no_write_permission'));
                }
            }),
            filter(([, hasWritePermission]) => hasWritePermission),
            map(() => ({ type: 'JUST_SAVE' } as P.SavePreismeldungPriceSaveAction)),
            mergeWith(this.requestPreismeldungSave$),
            withLatestFrom(this.isSaveDisabled$, (saveAction, isSaveDisabled) => ({ saveAction, isSaveDisabled })),
            (x) =>
                x.pipe(
                    filter((x) => !x.isSaveDisabled),
                    map(({ saveAction }) => ({ saveAction, isValid: this.form.valid })),
                    shareReplay({ bufferSize: 1, refCount: true }),
                ),
        );

        const saveWithBag$ = canSave$.pipe(
            filter((x) => x.isValid),
            map((x) => x.saveAction),
            withLatestFrom(this.preismeldung$, (saveAction, bag) => ({ saveAction, bag })),
            publishReplay(1),
            refCount(),
        );

        this.subscriptions.push(
            saveWithBag$
                .pipe(
                    filter((x) => x.bag.hasAttributeWarning),
                    mergeMap(() =>
                        pefDialogService.displayDialog(PefDialogValidationErrorsComponent, {
                            data: [translateService.instant('validation_produktMerkmale_erfassen')],
                            disableClose: true,
                        }),
                    ),
                )
                .subscribe(),
        );

        const saveLogic$ = saveWithBag$.pipe(
            withLatestFrom(this.isAdminApp$.pipe(startWith(false)), (x, isAdminApp) => assign({}, x, { isAdminApp })),
            filter((x) => !x.bag.hasAttributeWarning),
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
                                    data: [translateService.instant('validation_frage-antworten')],
                                    disableClose: true,
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
                        condition: () => bag.hasPriceWarning,
                        observable: () =>
                            observableIif(
                                () => !bag.messages.kommentar,
                                defer(() =>
                                    pefMessageDialogService.displayMessageDialog(
                                        [
                                            { textKey: 'btn_yes', dismissValue: 'YES' as const },
                                            { textKey: 'btn_verwerfen', dismissValue: 'THROW_CHANGES' as const },
                                            { textKey: 'btn_edit-comment', dismissValue: 'EDIT' as const },
                                        ],
                                        'dialogText_abnormal-preisentwicklung',
                                    ),
                                ),
                                // Always write autotext for "hasPriceWarning" https://github.com/Lambda-IT/lik-studio/issues/339
                                observableOf('YES' as const),
                            ).pipe(
                                map((res) => {
                                    switch (res) {
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
                            [1, 7].some((code) => code === this.form.value.bearbeitungscode) &&
                            bag.refPreismeldung.artikeltext === this.form.value.artikeltext &&
                            bag.refPreismeldung.artikelnummer === this.form.value.artikelnummer,
                        observable: () =>
                            pefMessageDialogService.displayDialogYesNo('dialogText_unveraendert-pm-text').pipe(
                                map((res) =>
                                    res === 'YES'
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
                            [99, 1].some((x) => x === this.form.value.bearbeitungscode) &&
                            this.form.value.aktion &&
                            bag.refPreismeldung.aktion &&
                            bag.preismeldung.d_DPToVP.percentage > 0,
                        observable: () =>
                            pefMessageDialogService
                                .displayDialogYesNoEdit('dialogText_aktion-message-preis-hoeher')
                                .pipe(
                                    map((res) =>
                                        res === 'EDIT'
                                            ? { type: 'CANCEL' }
                                            : res === 'YES'
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
                            [99, 1].some((x) => x === this.form.value.bearbeitungscode) &&
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
                                    map((res) =>
                                        res === 'EDIT'
                                            ? { type: 'CANCEL' }
                                            : res === 'YES'
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
                            [99, 1].some((x) => x === this.form.value.bearbeitungscode) &&
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
                                    map((res) => {
                                        switch (res) {
                                            case 'EDIT':
                                                return { type: 'CANCEL' as const };
                                            case 'YES':
                                                return {
                                                    type: saveAction.type,
                                                    saveWithData: [
                                                        {
                                                            type: 'COMMENT',
                                                            comments: [
                                                                'kommentar-autotext_aktueller-aktionspreis-gleich-groesser-vp-normalpreis',
                                                            ],
                                                        },
                                                    ],
                                                };
                                            case 'COMMENT':
                                                return {
                                                    type: 'SAVE_AND_NAVIGATE_TAB' as const,
                                                    saveWithData: [{ type: 'COMMENT', comments: [] }],
                                                    tabName: 'MESSAGES',
                                                };
                                        }
                                    }),
                                ) as any,
                    },
                    {
                        // Issue #151
                        // Code 2
                        // Falls Aktionspreis/Menge in T grösser/gleich Preis/Menge VPK, Dialog öffnen: „Aktueller Aktionspreis ist gleich oder grösser als Normalpreis in VP. Stimmt der erfasste Preis?“ mit [JA]
                        // -> autotext / [EDIT] / [Kommentar] -> falls möglich direkt zu Kommentarfeld wechseln (oder falls aufwändig zurück zur normalen Maske, also EDIT)
                        condition: () =>
                            [2, 7].some((x) => x === this.form.value.bearbeitungscode) &&
                            this.form.value.aktion &&
                            bag.preismeldung.d_DPToVPK.percentage >= 0,
                        observable: () =>
                            pefMessageDialogService
                                .displayMessageDialog(
                                    [
                                        { textKey: 'btn_yes', dismissValue: 'YES' as const },
                                        { textKey: 'btn_edit', dismissValue: 'EDIT' as const },
                                        { textKey: 'btn_comment', dismissValue: 'COMMENT' as const },
                                    ],
                                    'dialogText_aktueller-aktionspreis-gleich-groesser-vp-normalpreis',
                                )
                                .pipe(
                                    map((res) =>
                                        res === 'EDIT'
                                            ? { type: 'CANCEL' }
                                            : res === 'YES'
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
                                    map((res) =>
                                        res === 'YES'
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
                                    map((res) =>
                                        res === 'YES'
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
                    // Issue #502
                    // Falls für ein neuen Preis noch kein Stichdatum gesetzt ist
                    // -> autotext / [EDIT]
                    {
                        condition: () => !isAdminApp && needsStichtag(bag),
                        observable: () =>
                            pefMessageDialogService
                                .displayMessageDialog(
                                    [{ textKey: 'btn_edit', dismissValue: 'EDIT' as const }],
                                    'dialogText_needs-stichtag',
                                )
                                .pipe(mapTo({ type: 'CANCEL' })),
                    },
                ];

                const alertsToExecute = alerts.filter((x) => x.condition()).map((x) => x.observable);

                return alertsToExecute.length > 0
                    ? (alertsToExecute.reduce((agg, v) => {
                          if (!agg) return v().pipe(map((save) => ({ ...saveActionData(saveAction), ...save })));
                          return (agg as any).pipe(
                              mergeMap((lastAlertResult: any) => {
                                  if (
                                      lastAlertResult === 'THROW_CHANGES' ||
                                      ['CANCEL', 'NO_SAVE_NAVIGATE'].some((x) => x === lastAlertResult.type)
                                  )
                                      return observableOf(lastAlertResult);
                                  return v().pipe(
                                      map((thisAlertResult) => {
                                          if (
                                              P.isSavePreismeldungPriceSaveActionSave(lastAlertResult) &&
                                              P.isSavePreismeldungPriceSaveActionSave(thisAlertResult)
                                          ) {
                                              return {
                                                  ...saveActionData(saveAction),
                                                  ...thisAlertResult,
                                                  saveWithData: (
                                                      thisAlertResult as P.SavePreismeldungPriceSaveActionSave
                                                  ).saveWithData.concat(lastAlertResult.saveWithData),
                                              };
                                          } else {
                                              return { ...saveActionData(saveAction), ...thisAlertResult };
                                          }
                                      }),
                                  );
                              }),
                          );
                      }, null as unknown) as Observable<P.SavePreismeldungPriceSaveAction | string>)
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
            filter(
                (x): x is P.SavePreismeldungPriceSaveAction =>
                    x !== 'THROW_CHANGES' && (x as P.SavePreismeldungPriceSaveAction).type !== 'CANCEL',
            ),
        );
        this.requestThrowChanges$ = saveLogic$.pipe(
            filter((x) => x === 'THROW_CHANGES'),
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
                    filter((x) => !x.isValid),
                    map(() =>
                        keys(this.form.controls)
                            .filter((x) => !!this.form.controls[x].errors)
                            .map((controlName) => {
                                const control = this.form.controls[controlName];
                                const errorKey = keys(control.errors)[0];
                                const errorParams = {
                                    ...(control.errors || {})[errorKey],
                                    controlName: translateService.instant(`control_${controlName}`),
                                };
                                return translateService.instant(`validation_formatted_${errorKey}`, errorParams);
                            }),
                    ),
                    mergeMap((errorMessages) =>
                        pefDialogService.displayDialog(PefDialogValidationErrorsComponent, {
                            data: errorMessages.map((errorMessage) => translateService.instant(errorMessage)),
                            disableClose: true,
                        }),
                    ),
                )
                .subscribe(),
        );

        this.currentPeriodHeading$ = this.changeBearbeitungscode$.pipe(
            merge(this.distinctPreismeldung$.pipe(map((x) => x.preismeldung.bearbeitungscode))),
            combineLatest(infoPopoverRightActive$, (bearbeitungscode, infoPopoverRightActive) => {
                if (infoPopoverRightActive) {
                    return 'heading_artikel-ausser-aktion';
                }
                return [7, 2, 3].some((x) => x === bearbeitungscode) ? 'heading_artikel-neu' : 'heading_artikel';
            }),
        );

        const showInvalid$ = this.form.valueChanges.pipe(merge(this.attemptSave$)).pipe(publishReplay(1), refCount());
        this.createInvalidObservableFor = (controlName: string) =>
            showInvalid$.pipe(map(() => !!this.form.controls[controlName].errors));

        this.arrowDown$ = infoPopoverLeftActive$.pipe(
            combineLatest(this.preismeldung$, (infoPopoverLeftActive, bag) => ({ infoPopoverLeftActive, bag })),
            filter((x) => !!x.bag),
            map((x) =>
                x.infoPopoverLeftActive
                    ? x.bag.preismeldung.d_VPKToVPVorReduktion
                    : x.bag.preismeldung.d_VPKToVPAlterArtikel,
            ),
            publishReplay(1),
            refCount(),
        );

        this.vpPriceWarning$ = infoPopoverLeftActive$.pipe(
            combineLatest(this.preismeldung$, (infoPopoverLeftActive, bag) => ({ infoPopoverLeftActive, bag })),
            filter((x) => !!x.bag),
            map(
                (x) =>
                    x.bag.preismeldung.d_DPToVPVorReduktion.warning || x.bag.preismeldung.d_VPKToVPVorReduktion.warning,
            ),
            publishReplay(1),
            refCount(),
        );
        this.dpPriceWarning$ = infoPopoverRightActive$.pipe(
            combineLatest(this.preismeldung$, (infoPopoverLeftActive, bag) => ({ infoPopoverLeftActive, bag })),
            filter((x) => !!x.bag),
            map((x) => x.bag.preismeldung.d_DPVorReduktionToVP.warning),
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
            filter((x) => !!x.bag),
            map((x) => {
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
        return [0, 44, 101].some((x) => x === bearbeitungscode);
    }

    formatPercentageChange = (percentageChange: number) => formatPercentageChange(percentageChange, 1);

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
        this.subscriptions.filter((s) => !!s && !s.closed).forEach((s) => s.unsubscribe());
    }

    formLevelValidationFactory() {
        return (group: UntypedFormGroup) => {
            const bearbeitungscode = group.get('bearbeitungscode');
            const aktion = group.get('aktion');
            if ([2, 7].some((x) => x === bearbeitungscode?.value)) {
                const preisVPK = group.get('preisVPK')!;
                preisVPK.setErrors(
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 4 }),
                    ])!(preisVPK),
                );
                const mengeVPK = group.get('mengeVPK')!;
                mengeVPK.setErrors(
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 9999999.99, { padRight: 2, truncate: 2 }),
                    ])!(mengeVPK),
                );
            } else if (bearbeitungscode.value === 1 && !!aktion.value) {
                const preisVorReduktion = group.get('preisVorReduktion')!;
                preisVorReduktion.setErrors(
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 4 }),
                    ])!(preisVorReduktion),
                );
                const mengeVorReduktion = group.get('mengeVorReduktion')!;
                mengeVorReduktion.setErrors(
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 9999999.99, { padRight: 2, truncate: 2 }),
                    ])!(mengeVorReduktion),
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

    blurOnEnter(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            (event.target as HTMLElement).blur();
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

function needsStichtag(bag: P.CurrentPreismeldungBag) {
    return !!bag && bag.isNew && bag.preismeldung.erhebungsZeitpunkt === 99;
}
