/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
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

import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { range } from 'lodash';
import { defer, Observable, of, Subject } from 'rxjs';
import {
    combineLatest,
    delay,
    filter,
    flatMap,
    map,
    mapTo,
    merge,
    publishReplay,
    refCount,
    scan,
    startWith,
    take,
    takeUntil,
    withLatestFrom,
} from 'rxjs/operators';

import { DialogCancelEditComponent, PefDialogService, PefMessageDialogService, priceCountIdByPm } from '@lik-shared';

import * as P from '../../common-models';
import { DialogNewPmBearbeitungsCodeComponent } from '../../components/dialog';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'pms-price-entry',
    templateUrl: 'pms-price-entry.page.html',
    styleUrls: ['pms-price-entry.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PmsPriceEntryPage implements OnInit, OnDestroy {
    isDesktop$ = this.store.select(fromRoot.getIsDesktop).pipe(
        publishReplay(1),
        refCount(),
    );
    preismeldestelle$ = this.store.select(fromRoot.getCurrentPreismeldestelle).pipe(
        publishReplay(1),
        refCount(),
    );
    preismeldungenCurrentPmsNummer$ = this.store.select(fromRoot.getPreismeldungenCurrentPmsNummer).pipe(
        publishReplay(1),
        refCount(),
    );
    preismeldungen$ = this.store.select(fromRoot.getPreismeldungen).pipe(
        publishReplay(1),
        refCount(),
    );
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldungViewBag).pipe(
        publishReplay(1),
        refCount(),
    );
    currentLanguage$ = this.store.select(fromRoot.getCurrentLanguage).pipe(
        publishReplay(1),
        refCount(),
    );
    currentDate$ = this.store.select(fromRoot.getCurrentDate).pipe(
        publishReplay(1),
        refCount(),
    );
    isInRecordMode$ = this.store.select(fromRoot.getPreismeldungenIsInRecordMode).pipe(
        publishReplay(1),
        refCount(),
    );
    priceCountStatuses$ = this.store.select(fromRoot.getPriceCountStatuses);
    warenkorb$ = this.store.select(fromRoot.getWarenkorb);
    currentPriceCountStatus$ = this.currentPreismeldung$.pipe(
        combineLatest(this.priceCountStatuses$, (currentPreismeldung, priceCountStatuses) =>
            !currentPreismeldung ? null : priceCountStatuses[priceCountIdByPm(currentPreismeldung.preismeldung)],
        ),
    );
    markedPreismeldungen$ = this.store.select(fromRoot.getMarkedPreismeldungen);

    selectPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    save$ = new EventEmitter<P.SavePreismeldungPriceSaveAction>();
    saveOrder$ = new EventEmitter<P.Models.PmsPreismeldungenSortProperties>();
    updatePreismeldungPreis$ = new EventEmitter<P.PreismeldungPricePayload>();
    updatePreismeldungMessages$ = new EventEmitter<P.PreismeldungMessagesPayload>();
    updatePreismeldungAttributes$ = new EventEmitter<string[]>();
    setStichtag$ = new EventEmitter<number>();
    duplicatePreismeldung$ = new EventEmitter();
    addNewPreisreihe$ = new EventEmitter();
    navigateToPmsSort$ = new EventEmitter();
    recordSortPreismeldungen$ = new EventEmitter();
    ionViewDidLoad$ = new EventEmitter();
    resetPreismeldung$ = new EventEmitter();
    requestSelectNextPreismeldung$ = new EventEmitter<{}>();
    cancel$ = new EventEmitter<{}>();
    selectNextPreismeldungRequested$: Observable<{}>;
    requestThrowChanges$ = new EventEmitter<{}>();
    isNotSave$ = new EventEmitter<boolean>();
    disableQuickEqual$ = new EventEmitter<boolean>();
    filteredPreismeldungen$ = new EventEmitter<P.PreismeldungBag[]>();
    markPreismeldung$ = new EventEmitter<string>();

    selectTab$ = new EventEmitter<string>();
    toolbarButtonClicked$ = new EventEmitter<string>();

    requestPreismeldungSave$: Observable<P.SavePreismeldungPriceSaveAction>;
    requestPreismeldungQuickEqual$: Observable<{}>;

    selectedTab$: Observable<string>;
    snippets: string[];

    public chooseFromWarenkorbDisplayed$: Observable<boolean>;

    private onDestroy$ = new Subject<void>();

    constructor(
        translateService: TranslateService,
        activeRoute: ActivatedRoute,
        pefDialogService: PefDialogService,
        pefMessageDialogService: PefMessageDialogService,
        private navController: NavController,
        private store: Store<fromRoot.AppState>,
    ) {
        const cancelEditDialog$ = defer(() =>
            pefDialogService.displayDialog(DialogCancelEditComponent).pipe(map(x => x.data)),
        );

        const params$ = activeRoute.params.pipe(map(({ pmsNummer, reload }) => ({ pmsNummer, reload })));
        this.selectedTab$ = this.selectTab$.pipe(
            merge(
                this.save$.pipe(
                    filter(x => x.type === 'NO_SAVE_NAVIGATE' || x.type === 'SAVE_AND_NAVIGATE_TAB'),
                    map((x: P.SavePreismeldungPriceSaveActionNavigate) => x.tabName),
                ),
                this.resetPreismeldung$.pipe(
                    withLatestFrom(this.currentPreismeldung$),
                    filter(([, pm]) => !pm.refPreismeldung),
                    mapTo('PREISMELDUNG'),
                ),
            ),
            startWith('PREISMELDUNG'),
            publishReplay(1),
            refCount(),
        );
        this.snippets = range(1, 18).map(i => translateService.instant(`kommentar-text_${i}`));

        const requestNavigateHome$ = this.toolbarButtonClicked$.pipe(
            filter(x => x === 'HOME'),
            withLatestFrom(
                this.currentPreismeldung$.pipe(startWith(null)),
                (_, currentPreismeldung) => currentPreismeldung,
            ),
            flatMap(currentPreismeldung => {
                if (
                    !currentPreismeldung ||
                    (!!currentPreismeldung && !currentPreismeldung.isModified && !currentPreismeldung.isNew)
                ) {
                    return of('THROW_CHANGES');
                }
                return cancelEditDialog$;
            }),
            publishReplay(1),
            refCount(),
        );

        const filteredPreismeldungen$ = this.filteredPreismeldungen$.asObservable().pipe(
            publishReplay(1),
            refCount(),
        );

        const tabPair$ = this.selectedTab$.pipe(
            scan((agg, v) => ({ from: agg.to, to: v }), { from: null, to: null }),
            publishReplay(1),
            refCount(),
        );

        const createTabLeaveObservable = (tabName: string) =>
            tabPair$.pipe(
                filter(x => x.from === tabName),
                merge(
                    this.toolbarButtonClicked$.pipe(
                        filter(x => x === 'HOME'),
                        withLatestFrom(tabPair$, (_, tabPair) => tabPair),
                        filter(x => x.to === tabName),
                    ),
                ),
                merge(
                    this.selectPreismeldung$.pipe(
                        withLatestFrom(tabPair$, (_, tabPair) => tabPair),
                        filter(x => x.to === tabName),
                    ),
                ),
            );

        this.currentDate$.pipe(takeUntil(this.onDestroy$)).subscribe();

        createTabLeaveObservable('MESSAGES')
            .pipe(
                delay(50),
                withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung),
                filter(currentPreismeldung => !currentPreismeldung.isNew && currentPreismeldung.isMessagesModified),
                takeUntil(this.onDestroy$),
            )
            .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_MESSAGES' }));

        createTabLeaveObservable('PRODUCT_ATTRIBUTES')
            .pipe(
                withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung),
                filter(currentPreismeldung => !currentPreismeldung.isNew && currentPreismeldung.isAttributesModified),
                takeUntil(this.onDestroy$),
            )
            .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_ATTRIBUTES' }));

        requestNavigateHome$
            .pipe(
                filter(x => x === 'THROW_CHANGES'),
                takeUntil(this.onDestroy$),
            )
            .subscribe(() =>
                this.navigateToDashboard().then(() =>
                    setTimeout(() => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null }), 100),
                ),
            );

        this.requestPreismeldungQuickEqual$ = this.toolbarButtonClicked$.pipe(
            filter(x => x === 'PREISMELDUNG_QUICK_EQUAL'),
            map(() => new Date()),
        );

        this.updatePreismeldungPreis$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_PRICE', payload }));

        this.updatePreismeldungMessages$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_MESSAGES', payload }));

        this.updatePreismeldungAttributes$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_ATTRIBUTES', payload }));

        this.setStichtag$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(payload => store.dispatch({ type: 'SET_PREISMELDUNG_STICHTAG', payload }));

        this.save$
            .pipe(
                filter(x => x.type !== 'NO_SAVE_NAVIGATE'),
                takeUntil(this.onDestroy$),
            )
            // why do I need this setTimeout - is it an Ionic bug? requires two touches on tablet to register 'SAVE_AND_MOVE_TO_NEXT'
            .subscribe(payload => setTimeout(() => store.dispatch({ type: 'SAVE_PREISMELDUNG_PRICE', payload })));

        this.saveOrder$
            .pipe(
                withLatestFrom(params$),
                takeUntil(this.onDestroy$),
            )
            .subscribe(([sortOrderDoc, { pmsNummer }]) =>
                this.store.dispatch({
                    type: 'PREISMELDUNGEN_SORT_SAVE',
                    payload: { pmsNummer, sortOrderDoc },
                }),
            );

        this.currentPreismeldung$
            .pipe(
                filter(x => !!x && !!x.lastSaveAction && x.lastSaveAction.type === 'SAVE_AND_NAVIGATE_TO_DASHBOARD'),
                flatMap(() =>
                    this.navController
                        .navigateBack('/')
                        .then(() =>
                            setTimeout(() => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null }), 100),
                        ),
                ),
                takeUntil(this.onDestroy$),
            )
            .subscribe();

        const dialogNewPmbearbeitungsCode$ = defer(() =>
            pefDialogService.displayDialog(DialogNewPmBearbeitungsCodeComponent).pipe(map(x => x.data)),
        );
        const dialogSufficientPreismeldungen$ = defer(() =>
            pefMessageDialogService.displayDialogYesNo('dialogText_ausreichend-artikel').pipe(map(x => x.data)),
        );

        const requestSelectPreismeldung$ = this.selectPreismeldung$.pipe(
            withLatestFrom(
                this.currentPreismeldung$.pipe(startWith(null)),
                (selectedPreismeldung: P.PreismeldungBag, currentPreismeldung: P.CurrentPreismeldungBag) => ({
                    selectedPreismeldung,
                    currentPreismeldung,
                    isCurrentModified:
                        !!currentPreismeldung && (currentPreismeldung.isModified || currentPreismeldung.isNew),
                }),
            ),
        );

        requestSelectPreismeldung$
            .pipe(
                filter(x => !x.isCurrentModified),
                merge(this.cancel$.asObservable().pipe(map(() => ({ selectedPreismeldung: null })))),
                delay(100),
                takeUntil(this.onDestroy$),
            )
            .subscribe(x =>
                this.store.dispatch({
                    type: 'SELECT_PREISMELDUNG',
                    payload: x.selectedPreismeldung ? x.selectedPreismeldung.pmId : null,
                }),
            );

        this.requestThrowChanges$
            .pipe(
                withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung),
                delay(100),
                takeUntil(this.onDestroy$),
            )
            .subscribe(currentPreismeldung =>
                this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: currentPreismeldung.pmId }),
            );

        this.resetPreismeldung$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => this.store.dispatch({ type: 'RESET_PREISMELDUNG' }));

        const cancelEditReponse$ = requestSelectPreismeldung$.pipe(
            filter(x => x.isCurrentModified),
            flatMap(x =>
                cancelEditDialog$.pipe(map(y => ({ selectedPreismeldung: x.selectedPreismeldung, dialogCode: y }))),
            ),
            publishReplay(1),
            refCount(),
        );

        cancelEditReponse$
            .pipe(
                filter(x => x.dialogCode === 'THROW_CHANGES'),
                delay(100),
                takeUntil(this.onDestroy$),
            )
            .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: x.selectedPreismeldung.pmId }));

        this.requestPreismeldungSave$ = this.toolbarButtonClicked$.pipe(
            filter(x => x === 'PREISMELDUNG_SAVE'),
            withLatestFrom(filteredPreismeldungen$, this.currentPreismeldung$),
            map(
                ([, preismeldungen, currentPreismeldung]) =>
                    ({
                        type: 'SAVE_AND_MOVE_TO_NEXT',
                        nextId: (
                            preismeldungen[preismeldungen.findIndex(p => p.pmId === currentPreismeldung.pmId) + 1] || {
                                pmId: null,
                            }
                        ).pmId,
                    } as P.SavePreismeldungPriceSaveAction),
            ),
            merge(
                cancelEditReponse$.pipe(
                    filter(x => x.dialogCode === 'SAVE'),
                    withLatestFrom(filteredPreismeldungen$, this.currentPreismeldung$),
                    map(
                        ([, preismeldungen, currentPreismeldung]) =>
                            ({
                                type: 'SAVE_AND_MOVE_TO_NEXT',
                                nextId: (
                                    preismeldungen[
                                        preismeldungen.findIndex(p => p.pmId === currentPreismeldung.pmId) + 1
                                    ] || {
                                        pmId: null,
                                    }
                                ).pmId,
                            } as P.SavePreismeldungPriceSaveAction),
                    ),
                ),
            ),
            merge(
                requestNavigateHome$.pipe(
                    filter(x => x === 'SAVE'),
                    map(() => ({ type: 'SAVE_AND_NAVIGATE_TO_DASHBOARD' } as P.SavePreismeldungPriceSaveAction)),
                ),
            ),
        );

        const duplicatePreismeldung$ = this.duplicatePreismeldung$
            .pipe(
                withLatestFrom(
                    this.currentPreismeldung$,
                    this.priceCountStatuses$,
                    (_, currentPreismeldung: P.PreismeldungBag, priceCountStatuses: P.PriceCountStatusMap) => ({
                        priceCountStatus: priceCountStatuses[priceCountIdByPm(currentPreismeldung.preismeldung)],
                        currentPreismeldung,
                    }),
                ),
                flatMap(({ priceCountStatus, currentPreismeldung }) =>
                    priceCountStatus.enough
                        ? dialogSufficientPreismeldungen$.pipe(
                              map((response: string) => ({ response, currentPreismeldung })),
                          )
                        : of({ response: 'YES', currentPreismeldung }),
                ),
                filter(x => x.response === 'YES'),
                map(({ currentPreismeldung }) => ({ source: 'FROM_BUTTON', currentPreismeldung })),
                merge(
                    this.save$.pipe(
                        filter(x => x.type === 'SAVE_AND_DUPLICATE_PREISMELDUNG'),
                        withLatestFrom(this.currentPreismeldung$),
                        map(([_, currentPreismeldung]) => ({ source: 'FROM_CODE_0', currentPreismeldung })),
                    ),
                ),
                flatMap(({ source, currentPreismeldung }) =>
                    dialogNewPmbearbeitungsCode$.pipe(
                        map(({ action, bearbeitungscode }) => ({
                            action,
                            source,
                            bearbeitungscode,
                            currentPreismeldung,
                        })),
                    ),
                ),
            )
            .pipe(
                publishReplay(1),
                refCount(),
            );

        this.recordSortPreismeldungen$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => this.store.dispatch({ type: 'PREISMELDUNGEN_TOGGLE_RECORD_MODE' }));

        duplicatePreismeldung$
            .pipe(
                filter(x => x.action === 'OK'),
                takeUntil(this.onDestroy$),
            )
            .subscribe(({ bearbeitungscode, currentPreismeldung }) =>
                this.store.dispatch({
                    type: 'DUPLICATE_PREISMELDUNG',
                    payload: { bearbeitungscode, preismeldungToDuplicate: currentPreismeldung },
                }),
            );

        duplicatePreismeldung$
            .pipe(
                filter(x => x.action !== 'OK' && x.source === 'FROM_CODE_0'),
                takeUntil(this.onDestroy$),
            )
            .subscribe(x =>
                this.store.dispatch({
                    type: 'SAVE_PREISMELDUNG_PRICE',
                    payload: {
                        type: 'JUST_SAVE',
                        saveWithData: [{ type: 'COMMENT', comments: ['kommentar-autotext_keine-produkte'] }],
                    },
                }),
            );

        this.addNewPreisreihe$
            .pipe(
                withLatestFrom(params$),
                takeUntil(this.onDestroy$),
            )
            .subscribe(([, params]) => this.navigateToNewPriceSeries(params.pmsNummer));

        this.navigateToPmsSort$
            .pipe(
                takeUntil(this.onDestroy$),
                withLatestFrom(params$),
            )
            .subscribe(([, params]) => this.navigateToPmsSort(params.pmsNummer));

        this.markPreismeldung$
            .asObservable()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(pmId =>
                this.store.dispatch({
                    type: 'TOGGLE_MARK_PREISMELDUNG',
                    payload: pmId,
                }),
            );

        this.ionViewDidLoad$
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

        this.selectNextPreismeldungRequested$ = this.toolbarButtonClicked$.pipe(
            filter(x => x === 'REQUEST_SELECT_NEXT_PREISMELDUNG'),
            map(() => ({})),
            merge(this.requestSelectNextPreismeldung$),
            publishReplay(1),
            refCount(),
        );
    }

    ngOnInit() {
        this.ionViewDidLoad$.emit();
    }

    navigateToDashboard() {
        return this.navController.navigateRoot('/');
    }

    navigateToPmsSort(pmsNummer: string) {
        return this.navController.navigateRoot(['/pms-sort/', pmsNummer]);
    }

    navigateToNewPriceSeries(pmsNummer: string) {
        return this.navController.navigateRoot(['/new-price-series/', pmsNummer]);
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}
