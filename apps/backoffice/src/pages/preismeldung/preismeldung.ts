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

import { ChangeDetectionStrategy, Component, EventEmitter, Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { first, orderBy } from 'lodash';
import * as moment from 'moment';
import { WINDOW } from 'ngx-window-token';
import { defer, merge as mergeFrom, Observable, Subject, fromEvent } from 'rxjs';
import {
    delay,
    filter,
    flatMap,
    map,
    mapTo,
    merge,
    publishReplay,
    refCount,
    scan,
    skip,
    startWith,
    take,
    takeUntil,
    withLatestFrom,
    distinctUntilChanged,
} from 'rxjs/operators';

import {
    DialogCancelEditComponent,
    PefDialogService,
    PmsFilter,
    preismeldestelleId,
    PreismeldungAction,
} from '@lik-shared';

import { ActivatedRoute } from '@angular/router';
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
export class PreismeldungPage {
    public preismeldungen$ = this.store
        .select(fromRoot.getPreismeldungen)
        .pipe(
            map(preismeldungen =>
                orderBy(
                    preismeldungen,
                    [
                        pm => moment(new Date(pm.preismeldung.erfasstAt)).startOf('second'),
                        pm => +pm.preismeldung.epNummer,
                        pm => pm.preismeldung.laufnummer,
                    ],
                    ['desc', 'asc', 'asc'],
                ),
            ),
        );
    public preiszuweisungen$ = this.store.select(fromRoot.getPreiszuweisungen);
    public preiserhebers$ = this.store.select(fromRoot.getPreiserhebers);
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);
    public preismeldungenStatus$ = this.store.select(fromRoot.getPreismeldungenStatusMap);
    public erhebungspositions$ = this.store
        .select(fromRoot.getWarenkorb)
        .pipe(
            map(x =>
                x.filter(w => w.warenkorbItem.type === 'LEAF').map(w => w.warenkorbItem as P.Models.WarenkorbLeaf),
            ),
        );
    public warenkorb$ = this.store.select(fromRoot.getWarenkorb);
    public status$ = this.store.select(fromRoot.getPreismeldungenStatus);
    public currentPreismeldung$ = this.store
        .select(fromRoot.getCurrentPreismeldungViewBag)
        // Emit new object instead of null to update the async pipes
        .pipe(
            map(x => x || ({} as P.CurrentPreismeldungBag)),
            publishReplay(1),
            refCount(),
        );

    public updatePreismeldungPreis$ = new EventEmitter<P.PreismeldungPricePayload>();
    public selectPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    public updatePreismeldungAttributes$ = new EventEmitter<string[]>();
    public updatePreismeldungMessages$ = new EventEmitter<P.PreismeldungMessagesPayload>();
    public updateAllPmStatus$ = new EventEmitter<P.Models.PreismeldungStatusList>();
    public resetPreismeldung$ = new EventEmitter();
    public resetPreismeldungen$ = new EventEmitter();
    public setPreismeldungStatus$ = new EventEmitter<{ pmId: string; status: P.Models.PreismeldungStatus }>();
    public disableQuickEqual$ = new EventEmitter<boolean>();

    public globalFilterTextChanged$ = new EventEmitter<PmsFilter>();

    public preismeldestelle$ = this.currentPreismeldung$.pipe(
        filter(x => !!x.preismeldung),
        withLatestFrom(
            this.store.select(fromRoot.getPreismeldestelleState),
            (bag, state) => state.entities[preismeldestelleId(bag.preismeldung.pmsNummer)],
        ),
        publishReplay(1),
        refCount(),
    );
    public preiserheber$ = this.currentPreismeldung$.pipe(
        filter(x => !!x.preismeldung),
        withLatestFrom(this.preiserhebers$, this.preiszuweisungen$),
        map(([pm, preiserhebers, preiszuweisungen]) =>
            first(
                preiserhebers.filter(pe =>
                    preiszuweisungen
                        .filter(x =>
                            x.preismeldestellenNummern.some(pmsNummer => pmsNummer === pm.preismeldung.pmsNummer),
                        )
                        .map(x => x.preiserheberId)
                        .some(peId => peId === pe._id),
                ),
            ),
        ),
        publishReplay(1),
        refCount(),
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

    private ionViewDidLeave$ = new Subject();

    constructor(
        activeRoute: ActivatedRoute,
        protected store: Store<fromRoot.AppState>,
        @Inject(WINDOW) public wndw: Window,
        private pefDialogService: PefDialogService,
    ) {
        const cancelEditDialog$ = defer(() =>
            pefDialogService.displayDialog(DialogCancelEditComponent, {}).pipe(map(x => x.data)),
        );

        this.initialPmsNummer$ = activeRoute.params.pipe(map(({ pmsNummer }) => pmsNummer));

        this.initialFilter$ = this.store.select(fromRoot.getCurrentPreismeldungListFilter).pipe(take(1));

        const keyMap = {
            38: -1, // Up
            40: 1, // Down
        };
        const nextPmByArrowKeys$ = fromEvent(wndw.document, 'keydown').pipe(
            map((e: KeyboardEvent) => keyMap[e.keyCode]),
            filter(x => x !== undefined),
            withLatestFrom(this.currentPreismeldung$, this.preismeldungen$),
            map(
                ([next, currentPm, preismeldungen]) =>
                    preismeldungen[preismeldungen.findIndex(pm => pm.pmId === currentPm.pmId) + next],
            ),
            distinctUntilChanged(),
            filter(x => x !== undefined),
        );

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

        const tabPair$ = this.selectedTab$.pipe(
            scan((agg, v) => ({ from: agg.to, to: v }), { from: null, to: null }),
            publishReplay(1),
            refCount(),
        );

        const createTabLeaveObservable = (tabName: string) =>
            tabPair$.pipe(
                filter(x => x.from === tabName),
                merge(
                    this.selectPreismeldung$.pipe(
                        withLatestFrom(tabPair$, (_, tabPair) => tabPair),
                        filter(x => x.to === tabName),
                    ),
                ),
            );

        this.requestPreismeldungQuickEqual$ = this.toolbarButtonClicked$.pipe(
            filter(x => x === 'PREISMELDUNG_QUICK_EQUAL'),
            map(() => new Date()),
        );

        this.updatePreismeldungPreis$
            .pipe(takeUntil(this.ionViewDidLeave$))
            .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_PRICE', payload }));

        this.pmsFilterChanged$
            .pipe(
                filter(x => !!x),
                takeUntil(this.ionViewDidLeave$),
            )
            .subscribe(x => {
                this.store.dispatch({ type: 'UPDATE_PREISMELDUNG_LIST_FILTER', payload: x } as filterOptions.Action);
            });

        this.pmsFilterChanged$
            .pipe(
                filter(x => !!x),
                flatMap(x =>
                    this.pefDialogService
                        .displayLoading('Daten werden zusammengefasst, bitte warten...', {
                            requestDismiss$: this.preismeldungen$.pipe(
                                skip(1),
                                filter(x => !!x),
                                take(1),
                            ),
                        })
                        .pipe(mapTo(x)),
                ),
                takeUntil(this.ionViewDidLeave$),
            )
            .subscribe(x => {
                this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_BY_FILTER', payload: x } as PreismeldungAction);
            });

        const requestSelectPreismeldung$ = mergeFrom(this.selectPreismeldung$, nextPmByArrowKeys$).pipe(
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
                delay(100),
                takeUntil(this.ionViewDidLeave$),
            )
            .subscribe(x =>
                this.store.dispatch({
                    type: 'SELECT_PREISMELDUNG',
                    payload: x.selectedPreismeldung ? x.selectedPreismeldung.pmId : null,
                }),
            );

        const cancelEditReponse$ = requestSelectPreismeldung$.pipe(
            filter(x => x.isCurrentModified),
            flatMap(x =>
                cancelEditDialog$.pipe(map(y => ({ selectedPreismeldung: x.selectedPreismeldung, dialogCode: y }))),
            ),
            publishReplay(1),
            refCount(),
        );

        const showSavingDialog$ = defer(() =>
            this.pefDialogService.displayLoading('Daten werden gespeichert, bitte warten...', {
                requestDismiss$: this.currentPreismeldung$.pipe(
                    skip(1),
                    filter(x => !x.isModified),
                    take(1),
                ),
            }),
        );

        this.requestPreismeldungSave$ = cancelEditReponse$.pipe(
            filter(x => x.dialogCode === 'SAVE'),
            flatMap(() => showSavingDialog$),
            map(() => ({ type: 'SAVE_AND_MOVE_TO_NEXT' })),
        );

        cancelEditReponse$
            .pipe(
                filter(x => x.dialogCode === 'THROW_CHANGES'),
                delay(100),
                takeUntil(this.ionViewDidLeave$),
            )
            .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: x.selectedPreismeldung.pmId }));

        this.kommentarClearClicked$
            .pipe(takeUntil(this.ionViewDidLeave$))
            .subscribe(() => store.dispatch({ type: 'CLEAR_AUTOTEXTS' } as PreismeldungAction));

        this.save$
            .pipe(
                filter(x => x.type !== 'NO_SAVE_NAVIGATE'),
                flatMap(x => showSavingDialog$.pipe(mapTo(x))),
                takeUntil(this.ionViewDidLeave$),
            )
            .subscribe(payload => setTimeout(() => store.dispatch({ type: 'SAVE_PREISMELDUNG_PRICE', payload })));

        createTabLeaveObservable('PRODUCT_ATTRIBUTES')
            .pipe(
                withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung),
                filter(
                    currentPreismeldung =>
                        !!currentPreismeldung && !currentPreismeldung.isNew && currentPreismeldung.isAttributesModified,
                ),
                takeUntil(this.ionViewDidLeave$),
            )
            .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_ATTRIBUTES' }));

        createTabLeaveObservable('MESSAGES')
            .pipe(
                withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung),
                filter(
                    currentPreismeldung =>
                        !!currentPreismeldung && !currentPreismeldung.isNew && currentPreismeldung.isMessagesModified,
                ),
                takeUntil(this.ionViewDidLeave$),
            )
            .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_MESSAGES' }));

        this.updatePreismeldungAttributes$
            .pipe(takeUntil(this.ionViewDidLeave$))
            .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_ATTRIBUTES', payload }));

        this.updatePreismeldungMessages$
            .pipe(takeUntil(this.ionViewDidLeave$))
            .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_MESSAGES', payload }));

        this.resetPreismeldung$
            .pipe(
                withLatestFrom(this.currentPreismeldung$),
                takeUntil(this.ionViewDidLeave$),
            )
            .subscribe(([, pm]) => {
                this.store.dispatch(status.createRemovePreismeldungStatusAction(pm.pmId));
                this.store.dispatch({ type: 'RESET_PREISMELDUNG' });
            });

        this.resetPreismeldungen$
            .pipe(takeUntil(this.ionViewDidLeave$))
            .subscribe(() => this.store.dispatch({ type: 'PREISMELDUNGEN_RESET' }));

        this.setPreismeldungStatus$
            .pipe(takeUntil(this.ionViewDidLeave$))
            .subscribe(payload => this.store.dispatch(status.createSetPreismeldungenStatusAction(payload)));

        this.updateAllPmStatus$
            .pipe(takeUntil(this.ionViewDidLeave$))
            .subscribe(payload => this.store.dispatch(status.createSetPreismeldungenStatusBulkAction(payload)));
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' } as preismeldestelle.Action);
        this.store.dispatch({ type: 'PREISERHEBER_LOAD' });
        this.store.dispatch({ type: 'PREISZUWEISUNG_LOAD' });
        this.store.dispatch({ type: 'LOAD_WARENKORB' });
        this.store.dispatch({ type: 'LOAD_PREISMELDUNGEN_STATUS' });
    }

    public ionViewDidLeave() {
        this.store.dispatch(status.createApplyPreismeldungenStatusAction());
        this.ionViewDidLeave$.next();
    }
}
