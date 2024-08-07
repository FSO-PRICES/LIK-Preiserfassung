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
import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Inject, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { first, orderBy } from 'lodash';
import * as moment from 'moment';
import { WINDOW } from 'ngx-window-token';
import { Observable, Subject, combineLatest, defer, fromEvent, merge } from 'rxjs';
import {
    delay,
    distinctUntilChanged,
    filter,
    flatMap,
    map,
    mapTo,
    shareReplay,
    skip,
    startWith,
    switchMap,
    take,
    takeUntil,
    withLatestFrom,
} from 'rxjs/operators';

import {
    DialogSaveCancelEditComponent,
    PefDialogService,
    PmsFilter,
    PreismeldungAction,
    preismeldestelleId,
} from '@lik-shared';

import * as filterOptions from '../../actions/filter-options';
import * as preismeldestelle from '../../actions/preismeldestelle';
import * as status from '../../actions/preismeldungen-status';
import * as P from '../../common-models';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'preismeldung',
    templateUrl: 'preismeldung.html',
    styleUrls: ['preismeldung.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungPage implements AfterViewInit, OnDestroy {
    public preismeldungen$ = this.store
        .select(fromRoot.getPreismeldungen)
        .pipe(
            map((preismeldungen) =>
                orderBy(
                    preismeldungen,
                    [
                        (pm) => moment(new Date(pm.preismeldung.erfasstAt)).startOf('second'),
                        (pm) => +pm.preismeldung.epNummer,
                        (pm) => pm.preismeldung.laufnummer,
                    ],
                    ['desc', 'asc', 'asc'],
                ),
            ),
        );
    public preiszuweisungen$ = this.store.select(fromRoot.getPreiszuweisungen);
    public preiserhebers$ = this.store.select(fromRoot.getPreiserhebers);
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);
    public preismeldungenStatus$ = this.store.select(fromRoot.getPreismeldungenStatusMap);
    public hasWritePermission$ = this.store.select(fromRoot.hasWritePermission);

    public erhebungspositions$ = this.store
        .select(fromRoot.getWarenkorb)
        .pipe(
            map((x) =>
                x.filter((w) => w.warenkorbItem.type === 'LEAF').map((w) => w.warenkorbItem as P.Models.WarenkorbLeaf),
            ),
        );
    public warenkorb$ = this.store.select(fromRoot.getWarenkorb);
    // public status$ = this.store.select(fromRoot.getPreismeldungenStatus);

    public currentPreismeldung$ = this.store
        .select(fromRoot.getCurrentPreismeldungViewBag)
        // Emit new object instead of null to update the async pipes
        .pipe(
            map((x) => x || ({} as P.CurrentPreismeldungBag)),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

    public updatePreismeldungPreis$ = new EventEmitter<P.PreismeldungPricePayload>();
    public selectPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    public updatePreismeldungAttributes$ = new EventEmitter<string[]>();
    public savePreismeldungAttributes$ = new EventEmitter();
    public updatePreismeldungMessages$ = new EventEmitter<P.PreismeldungMessagesPayload>();
    public savePreismeldungMessages$ = new EventEmitter();
    public updateAllPmStatus$ = new EventEmitter<P.Models.PreismeldungStatusList>();
    public resetPreismeldung$ = new EventEmitter();
    public resetPreismeldungen$ = new EventEmitter();
    public setPreismeldungStatus$ = new EventEmitter<{ pmId: string; status: P.Models.PreismeldungStatus }>();
    public disableQuickEqual$ = new EventEmitter<boolean>();
    public quickEqualDisabled$: Observable<boolean>;

    public globalFilterTextChanged$ = new EventEmitter<PmsFilter>();

    public preismeldestelle$ = this.currentPreismeldung$.pipe(
        filter((x) => !!x.preismeldung),
        withLatestFrom(
            this.store.select(fromRoot.getPreismeldestelleState),
            (bag, state) => state.entities[preismeldestelleId(bag.preismeldung.pmsNummer)],
        ),
        shareReplay({ bufferSize: 1, refCount: true }),
    );
    public preiserheber$ = this.currentPreismeldung$.pipe(
        filter((x) => !!x.preismeldung),
        withLatestFrom(this.preiserhebers$, this.preiszuweisungen$),
        map(([pm, preiserhebers, preiszuweisungen]) =>
            first(
                preiserhebers.filter((pe) =>
                    preiszuweisungen
                        .filter((x) =>
                            x.preismeldestellenNummern.some((pmsNummer) => pmsNummer === pm.preismeldung.pmsNummer),
                        )
                        .map((x) => x.preiserheberId)
                        .some((peId) => peId === pe._id),
                ),
            ),
        ),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    public requestPreismeldungSave$: Observable<Partial<P.SavePreismeldungPriceSaveAction>>;

    public pmsFilterChanged$ = new EventEmitter<PmsFilter>();
    public duplicatePreismeldung$ = new EventEmitter();
    public requestSelectNextPreismeldung$ = new EventEmitter();
    public requestThrowChanges$ = new EventEmitter();
    public save$ = new EventEmitter<P.SavePreismeldungPriceSaveAction>();
    public toolbarButtonClicked$ = new EventEmitter<string>();
    public requestPreismeldungQuickEqual$: Observable<{}>;
    public kommentarClearClicked$ = new EventEmitter<{}>();

    public initialPmsNummer$: Observable<string>;
    public selectTab$ = new EventEmitter<string>();
    public selectedTab$: Observable<string>;
    public initialFilter$: Observable<PmsFilter>;

    public currentPreismeldungHasStatus$: Observable<boolean>;

    private onDestroy$ = new Subject<void>();

    constructor(
        activeRoute: ActivatedRoute,
        protected store: Store<fromRoot.AppState>,
        @Inject(WINDOW) public wndw: Window,
        private pefDialogService: PefDialogService,
        translate: TranslateService,
    ) {
        // Wrapped the disable event emitter into a delay 0 observable due to ExpressionChangedAfterItHasBeenCheckedError error
        this.quickEqualDisabled$ = combineLatest([
            this.disableQuickEqual$.asObservable().pipe(delay(0)),
            this.hasWritePermission$,
        ]).pipe(map(([disableQuickEqual, hasWritePermission]) => disableQuickEqual || !hasWritePermission));

        this.currentPreismeldungHasStatus$ = this.currentPreismeldung$.pipe(
            filter((x) => !!x.preismeldung),
            withLatestFrom(this.preismeldungenStatus$),
            map(([pm, statusMap]) => {
                return Boolean(statusMap[pm.preismeldung._id]) || statusMap[pm.preismeldung._id] === 0;
            }),
        );

        const cancelEditDialog$ = defer(() =>
            pefDialogService.displayDialog(DialogSaveCancelEditComponent, { disableClose: true }),
        );

        this.initialPmsNummer$ = activeRoute.params.pipe(map(({ pmsNummer }) => pmsNummer));

        this.initialFilter$ = this.store.select(fromRoot.getCurrentPreismeldungListFilter).pipe(take(1));

        const keyMap = {
            38: -1, // Up
            40: 1, // Down
        };
        const nextPmByArrowKeys$ = fromEvent(wndw.document, 'keydown').pipe(
            map((e: KeyboardEvent) => keyMap[e.keyCode]),
            filter((x) => x !== undefined),
            withLatestFrom(this.currentPreismeldung$, this.preismeldungen$),
            map(
                ([next, currentPm, preismeldungen]) =>
                    preismeldungen[preismeldungen.findIndex((pm) => pm.pmId === currentPm.pmId) + next],
            ),
            distinctUntilChanged(),
            filter((x) => x !== undefined),
        );

        const requestSelectPreismeldung$ = merge(this.selectPreismeldung$, nextPmByArrowKeys$).pipe(
            withLatestFrom(
                this.currentPreismeldung$.pipe(startWith(null)),
                (selectedPreismeldung: P.PreismeldungBag, currentPreismeldung: P.CurrentPreismeldungBag) => ({
                    selectedPreismeldung,
                    currentPreismeldung,
                }),
            ),
        );

        const cancelEditResponse$ = requestSelectPreismeldung$.pipe(
            filter((x) => !!x.currentPreismeldung),
            map((x) => ({
                ...x,
                source: x.currentPreismeldung.isModified
                    ? 'isCurrentModified'
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
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        const selectTabBasedOnCancelEditDialogResponse$ = cancelEditResponse$.pipe(
            filter((x) => x.dialogCode === 'KEEP_WORKING'),
            map((x) => {
                switch (x.source) {
                    case 'isCurrentModified':
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
                mapTo('PREISMELDUNG'),
            ),
        ).pipe(startWith('PREISMELDUNG'), shareReplay({ bufferSize: 1, refCount: true }));

        this.requestPreismeldungQuickEqual$ = this.toolbarButtonClicked$.pipe(
            filter((x) => x === 'PREISMELDUNG_QUICK_EQUAL'),
            map(() => new Date()),
        );

        this.updatePreismeldungPreis$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((payload) => store.dispatch({ type: 'UPDATE_PREISMELDUNG_PRICE', payload }));

        this.pmsFilterChanged$
            .pipe(
                filter((x) => !!x),
                takeUntil(this.onDestroy$),
            )
            .subscribe((x) => {
                this.store.dispatch({ type: 'UPDATE_PREISMELDUNG_LIST_FILTER', payload: x } as filterOptions.Action);
            });

        this.pmsFilterChanged$
            .pipe(
                filter((x) => !!x),
                flatMap((x) =>
                    this.pefDialogService
                        .displayLoading(translate.instant('label.standard.wird_bearbeited_bitte_warten'), {
                            requestDismiss$: this.preismeldungen$.pipe(
                                skip(1),
                                filter((x) => !!x),
                                take(1),
                            ),
                        })
                        .pipe(mapTo(x)),
                ),
                takeUntil(this.onDestroy$),
            )
            .subscribe((x) => {
                this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_BY_FILTER', payload: x } as PreismeldungAction);
            });

        merge(
            requestSelectPreismeldung$.pipe(
                filter(
                    (x) =>
                        !x.currentPreismeldung.isModified &&
                        x.currentPreismeldung &&
                        !(x.currentPreismeldung.isMessagesModified || x.currentPreismeldung.isAttributesModified),
                ),
                delay(100),
            ),
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
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((x) =>
                this.store.dispatch({
                    type: 'SELECT_PREISMELDUNG',
                    payload: x.selectedPreismeldung ? x.selectedPreismeldung.pmId : null,
                }),
            );

        const showSavingDialog$ = defer(() =>
            this.pefDialogService.displayLoading(translate.instant('label.standard.wird_gespeichert_bitte_warten'), {
                requestDismiss$: this.currentPreismeldung$.pipe(
                    skip(1),
                    filter((x) => !x.isModified),
                    take(1),
                ),
            }),
        );

        this.requestPreismeldungSave$ = cancelEditResponse$.pipe(
            filter((x) => x.dialogCode === 'SAVE' && x.source === 'isCurrentModified'),
            switchMap(() => showSavingDialog$),
            withLatestFrom(this.preismeldungen$, this.currentPreismeldung$),
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
        );

        this.kommentarClearClicked$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => store.dispatch({ type: 'CLEAR_AUTOTEXTS' } as PreismeldungAction));

        this.save$
            .pipe(
                filter((x) => x.type !== 'NO_SAVE_NAVIGATE'),
                flatMap((x) => showSavingDialog$.pipe(mapTo(x))),
                takeUntil(this.onDestroy$),
            )
            .subscribe((payload) => setTimeout(() => store.dispatch({ type: 'SAVE_PREISMELDUNG_PRICE', payload })));

        this.updatePreismeldungAttributes$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((payload) => store.dispatch({ type: 'UPDATE_PREISMELDUNG_ATTRIBUTES', payload }));

        merge(
            this.savePreismeldungAttributes$,
            cancelEditResponse$.pipe(filter((x) => x.source === 'isAttributesModified' && x.dialogCode === 'SAVE')),
        )
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => store.dispatch({ type: 'SAVE_PREISMELDUNG_ATTRIBUTES' }));

        this.updatePreismeldungMessages$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((payload) => store.dispatch({ type: 'UPDATE_PREISMELDUNG_MESSAGES', payload }));

        merge(
            this.savePreismeldungMessages$,
            cancelEditResponse$.pipe(filter((x) => x.source === 'isMessagesModified' && x.dialogCode === 'SAVE')),
        )
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => store.dispatch({ type: 'SAVE_PREISMELDUNG_MESSAGES' }));

        this.resetPreismeldung$
            .pipe(withLatestFrom(this.currentPreismeldung$), takeUntil(this.onDestroy$))
            .subscribe(([, pm]) => {
                this.store.dispatch(status.createRemovePreismeldungStatusAction(pm.pmId));
                this.store.dispatch({ type: 'RESET_PREISMELDUNG' });
            });

        this.resetPreismeldungen$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => this.store.dispatch({ type: 'PREISMELDUNGEN_RESET' }));

        this.setPreismeldungStatus$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((payload) => this.store.dispatch(status.createSetPreismeldungenStatusAction(payload)));

        this.updateAllPmStatus$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((payload) => this.store.dispatch(status.createSetPreismeldungenStatusBulkAction(payload)));
    }

    ngAfterViewInit() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' } as preismeldestelle.Action);
        this.store.dispatch({ type: 'PREISERHEBER_LOAD' });
        this.store.dispatch({ type: 'PREISZUWEISUNG_LOAD' });
        this.store.dispatch({ type: 'LOAD_WARENKORB' });
        this.store.dispatch({ type: 'LOAD_PREISMELDUNGEN_STATUS' });
    }

    ngOnDestroy() {
        this.store.dispatch(status.createApplyPreismeldungenStatusAction());
        this.onDestroy$.next();
    }
}
