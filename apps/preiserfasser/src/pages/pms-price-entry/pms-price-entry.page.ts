import { ChangeDetectionStrategy, Component, EventEmitter, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { range } from 'lodash';
import { Observable, Subject, combineLatest, defer, merge, of } from 'rxjs';
import { delay, filter, map, shareReplay, startWith, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { ofType, unionize } from 'unionize';

import {
    DialogSaveCancelEditComponent,
    PefDialogService,
    PefMessageDialogService,
    priceCountIdByPm,
} from '@lik-shared';

import * as P from '../../common-models';
import { DialogNewPmBearbeitungsCodeComponent, DialogNewPmBearbeitungsCodeResult } from '../../components/dialog';
import * as fromRoot from '../../reducers';

@UntilDestroy()
@Component({
    selector: 'pms-price-entry',
    templateUrl: 'pms-price-entry.page.html',
    styleUrls: ['pms-price-entry.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PmsPriceEntryPage implements OnInit {
    isDesktop$ = this.store.select(fromRoot.getIsDesktop).pipe(shareReplay({ bufferSize: 1, refCount: true }));
    preismeldestelle$ = this.store
        .select(fromRoot.getCurrentPreismeldestelle)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    preismeldungenCurrentPmsNummer$ = this.store
        .select(fromRoot.getPreismeldungenCurrentPmsNummer)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    preismeldungen$ = this.store
        .select(fromRoot.getPreismeldungen)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    currentPreismeldung$ = this.store
        .select(fromRoot.getCurrentPreismeldungViewBag)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    currentLanguage$ = this.store
        .select(fromRoot.getCurrentLanguage)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    currentDate$ = this.store.select(fromRoot.getCurrentDate).pipe(shareReplay({ bufferSize: 1, refCount: true }));
    isInRecordMode$ = this.store
        .select(fromRoot.getPreismeldungenIsInRecordMode)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    priceCountStatuses$ = this.store.select(fromRoot.getPriceCountStatuses);
    warenkorb$ = this.store.select(fromRoot.getWarenkorb);

    currentPriceCountStatus$ = combineLatest([this.currentPreismeldung$, this.priceCountStatuses$]).pipe(
        map(([currentPreismeldung, priceCountStatuses]) =>
            !currentPreismeldung ? null : priceCountStatuses[priceCountIdByPm(currentPreismeldung.preismeldung)],
        ),
    );

    markedPreismeldungen$ = this.store.select(fromRoot.getMarkedPreismeldungen);

    selectPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    save$ = new EventEmitter<P.SavePreismeldungPriceSaveAction>();
    saveOrder$ = new EventEmitter<P.Models.PmsPreismeldungenSortProperties>();
    updatePreismeldungPreis$ = new EventEmitter<P.PreismeldungPricePayload>();
    updatePreismeldungMessages$ = new EventEmitter<P.PreismeldungMessagesPayload>();
    savePreismeldungMessages$ = new EventEmitter();
    updatePreismeldungAttributes$ = new EventEmitter<string[]>();
    savePreismeldungAttributes$ = new EventEmitter();
    setStichtag$ = new EventEmitter<number>();
    duplicatePreismeldung$ = new EventEmitter();
    addNewPreisreihe$ = new EventEmitter();
    navigateToPmsSort$ = new EventEmitter();
    recordSortPreismeldungen$ = new EventEmitter();
    onInit$ = new Subject<void>();
    resetPreismeldung$ = new EventEmitter();
    requestSelectNextPreismeldung$ = new EventEmitter<{}>();
    cancel$ = new EventEmitter<{}>();
    selectNextPreismeldungRequested$: Observable<{}>;
    requestThrowChanges$ = new EventEmitter<{}>();
    isSaveDisabled$ = new EventEmitter<boolean>();
    _isSaveDisabled$ = this.isSaveDisabled$.pipe(delay(0), shareReplay({ bufferSize: 1, refCount: true }));
    disableQuickEqual$ = new EventEmitter<boolean>();
    filteredPreismeldungen$ = new EventEmitter<P.PreismeldungBag[]>();
    markPreismeldung$ = new EventEmitter<string>();

    selectTab$ = new EventEmitter<string>();
    toolbarButtonClicked$ = new EventEmitter<string>();

    requestPreismeldungSave$: Observable<P.SavePreismeldungPriceSaveAction>;
    requestPreismeldungQuickEqual$: Observable<Date>;

    selectedTab$: Observable<string>;
    snippets: string[];

    public chooseFromWarenkorbDisplayed$: Observable<boolean>;

    constructor(
        translateService: TranslateService,
        activeRoute: ActivatedRoute,
        pefDialogService: PefDialogService,
        pefMessageDialogService: PefMessageDialogService,
        private router: Router,
        private store: Store<fromRoot.AppState>,
    ) {
        const cancelEditDialog$ = defer(() =>
            pefDialogService.displayDialog(DialogSaveCancelEditComponent, { disableClose: true }),
        );

        const params$ = activeRoute.params.pipe(map(({ pmsNummer, reload }) => ({ pmsNummer, reload })));

        this.snippets = range(1, 18).map((i) => translateService.instant(`kommentar-text_${i}`));

        const requestNavigateHome$ = this.toolbarButtonClicked$.pipe(
            filter((x) => x === 'HOME'),
            withLatestFrom(
                this.currentPreismeldung$.pipe(startWith(null)),
                (_, currentPreismeldung) => currentPreismeldung,
            ),
            map((x) => ({
                ...x,
                source: x.isModified
                    ? 'isPmModified'
                    : x.isMessagesModified
                    ? 'isMessagesModified'
                    : x.isAttributesModified
                    ? 'isAttributesModified'
                    : null,
            })),
            switchMap((currentPreismeldung) => {
                return !currentPreismeldung || (!!currentPreismeldung && !currentPreismeldung.source)
                    ? of({ dialogCode: 'THROW_CHANGES', source: null } as const)
                    : cancelEditDialog$.pipe(map((y) => ({ dialogCode: y, source: currentPreismeldung.source })));
            }),
            tap((x) => {
                if (!x.source || x.dialogCode === 'THROW_CHANGES') {
                    this.navigateToDashboard().then(() =>
                        setTimeout(() => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null }), 100),
                    );
                }
            }),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        const filteredPreismeldungen$ = this.filteredPreismeldungen$
            .asObservable()
            .pipe(shareReplay({ bufferSize: 1, refCount: true }));

        this.currentDate$.pipe(untilDestroyed(this)).subscribe();

        this.requestPreismeldungQuickEqual$ = this.toolbarButtonClicked$.pipe(
            filter((x) => x === 'PREISMELDUNG_QUICK_EQUAL'),
            map(() => new Date()),
        );

        this.currentPreismeldung$
            .pipe(
                filter((x) => !!x && !!x.lastSaveAction && x.lastSaveAction.type === 'SAVE_AND_NAVIGATE_TO_DASHBOARD'),
                switchMap(() =>
                    this.router
                        .navigate(['/'])
                        .then(() =>
                            setTimeout(() => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null }), 100),
                        ),
                ),
                untilDestroyed(this),
            )
            .subscribe();

        const dialogNewPmbearbeitungsCode$ = defer(() =>
            pefDialogService.displayDialog(DialogNewPmBearbeitungsCodeComponent, { disableClose: true }),
        );
        const dialogSufficientPreismeldungen$ = defer(() =>
            pefMessageDialogService.displayDialogYesNo('dialogText_ausreichend-artikel'),
        );

        const requestSelectPreismeldung$ = this.selectPreismeldung$.pipe(
            withLatestFrom(
                this.currentPreismeldung$.pipe(startWith(null)),
                (selectedPreismeldung: P.PreismeldungBag, currentPreismeldung: P.CurrentPreismeldungBag) => ({
                    selectedPreismeldung,
                    currentPreismeldung,
                    isCurrentModified:
                        !!currentPreismeldung &&
                        (currentPreismeldung.isModified ||
                            currentPreismeldung.isNew ||
                            currentPreismeldung.isMessagesModified ||
                            currentPreismeldung.isAttributesModified),
                }),
            ),
        );

        this.requestThrowChanges$
            .pipe(
                withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung),
                delay(100),
                untilDestroyed(this),
            )
            .subscribe((currentPreismeldung) =>
                this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: currentPreismeldung.pmId }),
            );

        this.resetPreismeldung$
            .pipe(untilDestroyed(this))
            .subscribe(() => this.store.dispatch({ type: 'RESET_PREISMELDUNG' }));

        const cancelEditResponse$ = merge(
            requestSelectPreismeldung$.pipe(
                filter((x) => !!x.currentPreismeldung),
                map((x) => ({
                    ...x,
                    source: x.currentPreismeldung.isModified
                        ? 'isPmModified'
                        : x.currentPreismeldung.isMessagesModified
                        ? 'isMessagesModified'
                        : x.currentPreismeldung.isAttributesModified
                        ? 'isAttributesModified'
                        : null,
                })),
                filter((x) => !!x.source),
                switchMap((x) =>
                    cancelEditDialog$.pipe(
                        map((y) => ({ selectedPreismeldung: x.selectedPreismeldung, dialogCode: y, source: x.source })),
                    ),
                ),
            ),
            requestNavigateHome$.pipe(
                filter((x) => x.source && x.source !== 'isPmModified' && x.dialogCode === 'SAVE'),
                withLatestFrom(this.currentPreismeldung$),
                map(([x, currentPreismeldung]) => ({
                    selectedPreismeldung: currentPreismeldung,
                    dialogCode: x.dialogCode,
                    source: x.source,
                })),
                tap(() => {
                    this.navigateToDashboard().then(() =>
                        setTimeout(() => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null }), 100),
                    );
                }),
            ),
        ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

        const selectTabBasedOnCancelEditDialogResponse$ = merge(cancelEditResponse$, requestNavigateHome$).pipe(
            filter((x) => x.dialogCode === 'KEEP_WORKING'),
            map((x) => {
                switch (x.source) {
                    case 'isPmModified':
                        return 'PREISMELDUNG';
                    case 'isMessagesModified':
                        return 'MESSAGES';
                    case 'isAttributesModified':
                        return 'PRODUCT_ATTRIBUTES';
                    default:
                        return null;
                }
            }),
            filter((x) => !!x),
        );

        merge(
            requestSelectPreismeldung$.pipe(filter((x) => !x.isCurrentModified)),
            this.cancel$.asObservable().pipe(map(() => ({ selectedPreismeldung: null }))),
            cancelEditResponse$.pipe(
                filter((x) => x.dialogCode === 'SAVE'),
                withLatestFrom(this.currentPreismeldung$),
                map(([cancelEditResponse, currentPreismeldung]) => ({
                    selectedPreismeldung: cancelEditResponse.selectedPreismeldung,
                    currentPreismeldung,
                })),
                switchMap((bag) =>
                    this.currentPreismeldung$.pipe(
                        filter((x) => !x.isMessagesModified && !x.isAttributesModified && !x.isModified),
                        take(1),
                        map(() => bag),
                    ),
                ),
            ),
            cancelEditResponse$.pipe(filter((x) => x.dialogCode === 'THROW_CHANGES')),
        )
            .pipe(untilDestroyed(this))
            .subscribe((x) =>
                this.store.dispatch({
                    type: 'SELECT_PREISMELDUNG',
                    payload: x.selectedPreismeldung ? x.selectedPreismeldung.pmId : null,
                }),
            );

        this.selectedTab$ = merge(
            this.selectTab$,
            selectTabBasedOnCancelEditDialogResponse$,
            this.save$.pipe(
                filter((x) => x.type === 'NO_SAVE_NAVIGATE' || x.type === 'SAVE_AND_NAVIGATE_TAB'),
                map((x: P.SavePreismeldungPriceSaveActionNavigate) => x.tabName),
            ),
            this.resetPreismeldung$.pipe(
                withLatestFrom(this.currentPreismeldung$),
                filter(([, pm]) => !pm.refPreismeldung),
                map(() => 'PREISMELDUNG'),
            ),
        ).pipe(startWith('PREISMELDUNG'), shareReplay({ bufferSize: 1, refCount: true }));

        this.requestPreismeldungSave$ = merge(
            this.toolbarButtonClicked$.pipe(
                filter((x) => x === 'PREISMELDUNG_SAVE'),
                withLatestFrom(filteredPreismeldungen$, this.currentPreismeldung$),
                map(
                    ([, preismeldungen, currentPreismeldung]) =>
                        ({
                            type: 'SAVE_AND_MOVE_TO_NEXT',
                            nextId: (
                                preismeldungen[
                                    preismeldungen.findIndex((p) => p.pmId === currentPreismeldung.pmId) + 1
                                ] || {
                                    pmId: null,
                                }
                            ).pmId,
                        } as P.SavePreismeldungPriceSaveAction),
                ),
            ),
            cancelEditResponse$.pipe(
                filter((x) => x.dialogCode === 'SAVE' && x.source === 'isPmModified'),
                withLatestFrom(filteredPreismeldungen$, this.currentPreismeldung$),
                map(
                    ([, preismeldungen, currentPreismeldung]) =>
                        ({
                            type: 'SAVE_AND_MOVE_TO_NEXT',
                            nextId: (
                                preismeldungen[
                                    preismeldungen.findIndex((p) => p.pmId === currentPreismeldung.pmId) + 1
                                ] || {
                                    pmId: null,
                                }
                            ).pmId,
                        } as P.SavePreismeldungPriceSaveAction),
                ),
            ),
            requestNavigateHome$.pipe(
                filter((x) => x.dialogCode === 'SAVE'),
                map(() => ({ type: 'SAVE_AND_NAVIGATE_TO_DASHBOARD' } as P.SavePreismeldungPriceSaveAction)),
            ),
        );

        type DuplicatePreisMeldungSource = 'FROM_BUTTON' | 'FROM_CODE_0';
        const DuplicatePreisMeldungResult = unionize({
            OK: ofType<{
                source: DuplicatePreisMeldungSource;
                bearbeitungscode: number;
                currentPreismeldung: P.PreismeldungBag;
            }>(),
            Cancel: ofType<{ source: DuplicatePreisMeldungSource }>(),
        });

        const duplicatePreismeldung$ = merge(
            this.duplicatePreismeldung$.pipe(
                withLatestFrom(
                    this.currentPreismeldung$,
                    this.priceCountStatuses$,
                    (_, currentPreismeldung: P.PreismeldungBag, priceCountStatuses: P.PriceCountStatusMap) => ({
                        priceCountStatus: priceCountStatuses[priceCountIdByPm(currentPreismeldung.preismeldung)],
                        currentPreismeldung,
                    }),
                ),
                switchMap(({ priceCountStatus, currentPreismeldung }) =>
                    priceCountStatus.enough
                        ? dialogSufficientPreismeldungen$.pipe(map((response) => ({ response, currentPreismeldung })))
                        : of({ response: 'YES' as const, currentPreismeldung }),
                ),
                filter((x) => x.response === 'YES'),
                map(({ currentPreismeldung }) => ({ source: 'FROM_BUTTON' as const, currentPreismeldung })),
            ),
            this.save$.pipe(
                filter((x) => x.type === 'SAVE_AND_DUPLICATE_PREISMELDUNG'),
                withLatestFrom(this.currentPreismeldung$),
                map(([_, currentPreismeldung]) => ({ source: 'FROM_CODE_0' as const, currentPreismeldung })),
            ),
        ).pipe(
            switchMap(({ source, currentPreismeldung }) =>
                dialogNewPmbearbeitungsCode$.pipe(
                    map((result) =>
                        DialogNewPmBearbeitungsCodeResult.match(result, {
                            OK: ({ bearbeitungscode }) =>
                                DuplicatePreisMeldungResult.OK({ bearbeitungscode, source, currentPreismeldung }),
                            Cancel: () => DuplicatePreisMeldungResult.Cancel({ source }),
                        }),
                    ),
                ),
            ),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.recordSortPreismeldungen$
            .pipe(untilDestroyed(this))
            .subscribe(() => this.store.dispatch({ type: 'PREISMELDUNGEN_TOGGLE_RECORD_MODE' }));

        duplicatePreismeldung$
            .pipe(filter(DuplicatePreisMeldungResult.is.OK), untilDestroyed(this))
            .subscribe(({ bearbeitungscode, currentPreismeldung }) =>
                this.store.dispatch({
                    type: 'DUPLICATE_PREISMELDUNG',
                    payload: { bearbeitungscode, preismeldungToDuplicate: currentPreismeldung },
                }),
            );

        duplicatePreismeldung$
            .pipe(
                filter(DuplicatePreisMeldungResult.is.Cancel),
                filter((x) => x.source === 'FROM_CODE_0'),
                untilDestroyed(this),
            )
            .subscribe(() =>
                this.store.dispatch({
                    type: 'SAVE_PREISMELDUNG_PRICE',
                    payload: {
                        type: 'JUST_SAVE',
                        saveWithData: [{ type: 'COMMENT', comments: ['kommentar-autotext_keine-produkte'] }],
                    },
                }),
            );

        this.addNewPreisreihe$
            .pipe(withLatestFrom(params$), untilDestroyed(this))
            .subscribe(([, params]) => this.navigateToNewPriceSeries(params.pmsNummer));

        this.navigateToPmsSort$
            .pipe(withLatestFrom(params$), untilDestroyed(this))
            .subscribe(([, params]) => this.navigateToPmsSort(params.pmsNummer));

        this.markPreismeldung$
            .asObservable()
            .pipe(untilDestroyed(this))
            .subscribe((pmId) =>
                this.store.dispatch({
                    type: 'TOGGLE_MARK_PREISMELDUNG',
                    payload: pmId,
                }),
            );

        this.updatePreismeldungPreis$
            .pipe(untilDestroyed(this))
            .subscribe((payload) => store.dispatch({ type: 'UPDATE_PREISMELDUNG_PRICE', payload }));

        this.updatePreismeldungMessages$
            .pipe(untilDestroyed(this))
            .subscribe((payload) => store.dispatch({ type: 'UPDATE_PREISMELDUNG_MESSAGES', payload }));

        merge(
            this.savePreismeldungMessages$,
            cancelEditResponse$.pipe(filter((x) => x.source === 'isMessagesModified' && x.dialogCode === 'SAVE')),
        )
            .pipe(untilDestroyed(this))
            .subscribe(() => store.dispatch({ type: 'SAVE_PREISMELDUNG_MESSAGES' }));

        this.updatePreismeldungAttributes$
            .pipe(untilDestroyed(this))
            .subscribe((payload) => store.dispatch({ type: 'UPDATE_PREISMELDUNG_ATTRIBUTES', payload }));

        merge(
            this.savePreismeldungAttributes$,
            cancelEditResponse$.pipe(filter((x) => x.source === 'isAttributesModified' && x.dialogCode === 'SAVE')),
        )
            .pipe(untilDestroyed(this))
            .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_ATTRIBUTES' }));

        this.setStichtag$
            .pipe(untilDestroyed(this))
            .subscribe((payload) => store.dispatch({ type: 'SET_PREISMELDUNG_STICHTAG', payload }));

        this.save$
            .pipe(
                filter((x) => x.type !== 'NO_SAVE_NAVIGATE'),
                untilDestroyed(this),
            )

            // why do I need this setTimeout - is it an Ionic bug? requires two touches on tablet to register 'SAVE_AND_MOVE_TO_NEXT'
            .subscribe((payload) => setTimeout(() => store.dispatch({ type: 'SAVE_PREISMELDUNG_PRICE', payload })));

        this.saveOrder$.pipe(withLatestFrom(params$), untilDestroyed(this)).subscribe(([sortOrderDoc, { pmsNummer }]) =>
            this.store.dispatch({
                type: 'PREISMELDUNGEN_SORT_SAVE',
                payload: { pmsNummer, sortOrderDoc },
            }),
        );

        this.onInit$
            .pipe(
                take(1),
                withLatestFrom(
                    params$,
                    this.preismeldungenCurrentPmsNummer$,
                    (_, params, preismeldungenCurrentPmsNummer) => ({ params, preismeldungenCurrentPmsNummer }),
                ),
                filter(
                    ({ params, preismeldungenCurrentPmsNummer }) =>
                        preismeldungenCurrentPmsNummer !== params.pmsNummer || !!params.reload,
                ),
            )
            .subscribe(({ params }) => {
                this.store.dispatch({ type: 'PREISMELDUNGEN_RESET' });
                this.store.dispatch({
                    type: 'PREISMELDUNGEN_LOAD_FOR_PMS',
                    payload: params.pmsNummer,
                });
            });

        this.selectNextPreismeldungRequested$ = merge(
            this.toolbarButtonClicked$.pipe(
                filter((x) => x === 'REQUEST_SELECT_NEXT_PREISMELDUNG'),
                map(() => ({})),
            ),
            this.requestSelectNextPreismeldung$,
        ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }

    ngOnInit() {
        this.onInit$.next();
    }

    navigateToDashboard() {
        return this.router.navigate(['/']);
    }

    navigateToPmsSort(pmsNummer: string) {
        return this.router.navigate(['/pms-sort/', pmsNummer]);
    }

    navigateToNewPriceSeries(pmsNummer: string) {
        return this.router.navigate(['/new-price-series/', pmsNummer]);
    }
}
