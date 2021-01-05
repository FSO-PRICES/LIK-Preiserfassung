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

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChange,
    ViewChild,
    Inject,
} from '@angular/core';
import { IonContent } from '@ionic/angular';
import { ItemReorderEventDetail } from '@ionic/core';
import { TranslateService } from '@ngx-translate/core';
import { addDays, isAfter, isBefore, subMilliseconds } from 'date-fns';
import dragula from 'dragula';
import { findLastIndex, minBy, orderBy, sortBy, takeWhile } from 'lodash';
import { WINDOW } from 'ngx-window-token';
import { merge as mergeFrom, Observable, Subject, fromEvent } from 'rxjs';
import {
    combineLatest,
    debounceTime,
    delay,
    filter,
    map,
    mapTo,
    merge,
    publishReplay,
    refCount,
    scan,
    shareReplay,
    startWith,
    takeUntil,
    withLatestFrom,
    distinctUntilChanged,
} from 'rxjs/operators';

import {
    formatPercentageChange,
    initDragula,
    parseDate,
    pefSearch,
    PefVirtualScrollComponent,
    ReactiveComponent,
} from '@lik-shared';

import * as P from '../../../../common-models';

type Filters = 'TODO' | 'COMPLETED' | 'ALL' | 'FAVORITES';
type DropPreismeldungArg = { preismeldungPmId: string; dropBeforePmId: string };
type AdvancedPreismeldungBag = P.PreismeldungBag & {
    marked: boolean;
    moving: boolean;
    disableMove: boolean;
    dragable: boolean;
    dragableTo: boolean;
    lastUploaded: boolean;
    stichtagStatus: string;
    percentage: string;
    bearbeitungscodeDescription: string;
};
const DRAGABLE_CLASS = 'dragable-item';
const DRAGTOABLE_CLASS = 'dragable-to-item';

@Component({
    selector: 'preismeldung-list',
    templateUrl: 'preismeldung-list.html',
    styleUrls: ['preismeldung-list.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungListComponent extends ReactiveComponent implements OnChanges, OnDestroy, AfterViewInit {
    @ViewChild(IonContent, { static: true }) content: IonContent;
    @ViewChild(IonContent, { read: ElementRef, static: true }) contentElementRef: ElementRef;
    @Input() isDesktop: boolean;
    @Input() currentDate: Date;
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Input() currentLanguage: string;
    @Input() preismeldungen: P.PreismeldungBag[];
    @Input() currentPreismeldung: P.CurrentPreismeldungBag;
    @Input() requestSelectNextPreismeldung: {};
    @Input() isInRecordMode: boolean;
    @Input() markedPreismeldungen: string[];
    @Input() saved: {};
    @Output('selectPreismeldung') selectPreismeldung$: Observable<P.PreismeldungBag>;
    @Output('addNewPreisreihe') addNewPreisreihe$ = new EventEmitter();
    @Output('sortPreismeldungen') sortPreismeldungen$ = new EventEmitter();
    @Output('recordSortPreismeldungen') recordSortPreismeldungen$ = new EventEmitter();
    @Output('filteredPreismeldungen') filteredPreismeldungen$: Observable<AdvancedPreismeldungBag[]>;
    @Output('markPreismeldung') markPreismeldung$ = new EventEmitter<string>();
    @Output('saveOrder') saveOrder$: Observable<P.Models.PmsPreismeldungenSortProperties>;

    @ViewChild(PefVirtualScrollComponent, { static: true }) private virtualScroll: any;
    @ViewChild('pmList', { static: true, read: ElementRef }) private pmList: ElementRef<HTMLElement>;

    public selectClickedPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    public selectNextPreismeldung$ = new EventEmitter();
    public selectPrevPreismeldung$ = new EventEmitter();
    public activateReordering$ = new EventEmitter<HammerInput>();
    public startDrag$ = new EventEmitter<MouseEvent | TouchEvent>();
    public reordered$ = new EventEmitter<CustomEvent<ItemReorderEventDetail>>();

    public viewPortItems: P.Models.Preismeldung[];
    public scrollList: AdvancedPreismeldungBag[];
    public completedCount$: Observable<string>;
    public isReorderingActive$: Observable<boolean>;
    public isMoving$: Observable<boolean>;

    private drake: dragula.Drake;
    private scroll: any;

    public filterText$ = new EventEmitter<string>();
    public selectFilterClicked$ = new EventEmitter<Filters>();
    public sortErhebungsschemaClicked$ = new EventEmitter();
    public dropPreismeldung$ = new EventEmitter<DropPreismeldungArg>();
    public movePreismeldung$ = new EventEmitter<AdvancedPreismeldungBag>();

    public noPreismeldungen$: Observable<string>;
    public filterTodoColor$: Observable<string>;
    public filterCompletedColor$: Observable<string>;
    public filterAllColor$: Observable<string>;
    public filterFavoritesColor$: Observable<string>;
    public noFavorites$: Observable<boolean>;
    public canReorder$: Observable<boolean>;
    public sortErhebungsschemaColor$: Observable<string>;

    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle').pipe(
        publishReplay(1),
        refCount(),
    );
    public currentLanguage$ = this.observePropertyCurrentValue<string>('currentLanguage');
    public currentPreismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>(
        'currentPreismeldung',
    ).pipe(
        publishReplay(1),
        refCount(),
    );
    public currentDate$ = this.observePropertyCurrentValue<Date>('currentDate').pipe(
        publishReplay(1),
        refCount(),
    );
    private preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen');
    private markedPreismeldungen$ = this.observePropertyCurrentValue<string[]>('markedPreismeldungen');

    public ionItemHeight$ = new EventEmitter<number>();
    public itemHeight = 60;

    private onDestroy$ = new Subject();

    constructor(translateService: TranslateService, @Inject(WINDOW) public wndw: Window) {
        super();

        this.ionItemHeight$.asObservable().subscribe(itemHeight => {
            return (this.itemHeight = itemHeight);
        });

        this.currentDate$.pipe(takeUntil(this.onDestroy$)).subscribe();
        this.isReorderingActive$ = this.activateReordering$.pipe(
            scan(prev => !prev, false),
            startWith(false),
            publishReplay(1),
            refCount(),
        );
        this.reordered$.pipe(takeUntil(this.onDestroy$)).subscribe(x => x.detail.complete());

        const markedPreismeldungen$ = this.markedPreismeldungen$.pipe(startWith([]));
        const saved$ = this.observePropertyCurrentValue<{}>('saved');

        const selectFilter$ = this.selectFilterClicked$.pipe(
            startWith('ALL' as Filters),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
        const isFilter = (f: Filters) =>
            selectFilter$.pipe(
                startWith(false),
                map(x => x === f),
            );
        const filterAll$ = isFilter('ALL');
        const filterCompleted$ = isFilter('COMPLETED');
        const filterTodo$ = isFilter('TODO');
        const filterFavorites$ = isFilter('FAVORITES');

        this.filterTodoColor$ = filterTodo$.pipe(map(toColor));
        this.filterCompletedColor$ = filterCompleted$.pipe(map(toColor));
        this.filterAllColor$ = filterAll$.pipe(map(toColor));
        this.filterFavoritesColor$ = filterFavorites$.pipe(map(toColor));

        const sortByErhebungsschema$ = this.sortErhebungsschemaClicked$.pipe(
            scan((x, _) => !x, false),
            startWith(false),
            publishReplay(1),
            refCount(),
        );
        this.sortErhebungsschemaColor$ = sortByErhebungsschema$.pipe(map(toColor));

        this.canReorder$ = filterAll$.pipe(
            combineLatest(
                filterFavorites$,
                sortByErhebungsschema$,
                (all, favorites, sortByErhebungsschema) => all && !favorites && !sortByErhebungsschema,
            ),
            publishReplay(1),
            refCount(),
        );

        const moveAction$ = this.movePreismeldung$.pipe(
            withLatestFrom(this.canReorder$),
            filter(([bag, canReorder]) => !bag.disableMove && canReorder),
            map(([bag]) => bag.pmId),
        );
        type MovePm = { moveTo: DropPreismeldungArg; selected: string };
        const movePm$ = moveAction$.pipe(
            merge(mergeFrom(saved$, this.startDrag$, this.activateReordering$).pipe(mapTo(null))),
            scan<string, MovePm>(
                (prev, selected) => {
                    return selected === null || prev.selected === null
                        ? { moveTo: null, selected }
                        : selected === prev.selected
                        ? { moveTo: null, selected: null }
                        : { moveTo: { dropBeforePmId: selected, preismeldungPmId: prev.selected }, selected: null };
                },
                { moveTo: null, selected: null },
            ),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
        const moveToPm$ = movePm$.pipe(
            filter(({ moveTo }) => moveTo !== null),
            map(({ moveTo }) => moveTo),
        );
        const markedToMove$ = movePm$.pipe(
            map(({ selected }) => (!!selected ? [selected] : [])),
            startWith([] as string[]),
            publishReplay(1),
            refCount(),
        );

        this.isMoving$ = markedToMove$.pipe(map(list => list.length > 0));

        const currentPreismeldung$ = this.currentPreismeldung$.pipe(
            withLatestFrom(markedPreismeldungen$, markedToMove$, this.currentDate$),
            map(([bag, markedIds, markedToMove, currentDate]) =>
                bag
                    ? {
                          ...bag,
                          marked: markedIds.some(id => id === bag.pmId),
                          moving: markedToMove.indexOf(bag.pmId) !== -1,
                          stichtagStatus: this.calcStichtagStatus(bag, currentDate),
                          percentage: this.formatPercentageChange(bag.preismeldung),
                          bearbeitungscodeDescription: this.getBearbeitungscodeDescription(
                              bag.preismeldung.bearbeitungscode,
                          ),
                      }
                    : null,
            ),
        );

        this.startDrag$.pipe(takeUntil(this.onDestroy$)).subscribe(evt => (this.drake as any).grab(evt));

        const filterChanged$ = this.filterText$.pipe(
            startWith(''),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.filteredPreismeldungen$ = <Observable<AdvancedPreismeldungBag[]>>this.preismeldungen$.pipe(
            withLatestFrom(this.currentDate$),
            combineLatest(markedPreismeldungen$, markedToMove$),
            map(([[preismeldungen, currentDate], markedIds, markedToMove]) =>
                preismeldungen.map(bag => ({
                    ...bag,
                    marked: markedIds.lastIndexOf(bag.pmId) !== -1,
                    moving: markedToMove.indexOf(bag.pmId) !== -1,
                    stichtagStatus: this.calcStichtagStatus(bag, currentDate),
                    percentage: this.formatPercentageChange(bag.preismeldung),
                    bearbeitungscodeDescription: this.getBearbeitungscodeDescription(bag.preismeldung.bearbeitungscode),
                })),
            ),
            combineLatest(sortByErhebungsschema$, (preismeldungen, sortByErhebungsschema) =>
                sortByErhebungsschema
                    ? sortBy(
                          preismeldungen,
                          bag => bag.warenkorbPosition.index + parseInt(bag.preismeldung.laufnummer, 10) * 0.01,
                      )
                    : preismeldungen,
            ),
            combineLatest(
                filterChanged$,
                selectFilter$,
                this.currentLanguage$,
                (preismeldungen, filterText, filterStatus, currentLanguage) => {
                    let filteredPreismeldungen = preismeldungen;

                    if (filterText && filterText.length > 0) {
                        filteredPreismeldungen = pefSearch(filterText, preismeldungen, [
                            pm => pm.warenkorbPosition.gliederungspositionsnummer,
                            pm => pm.warenkorbPosition.positionsbezeichnung[currentLanguage],
                            pm => pm.preismeldung.artikeltext,
                        ]);
                    }

                    switch (filterStatus) {
                        case 'FAVORITES':
                            return filteredPreismeldungen.filter(bag => bag.marked);
                        case 'COMPLETED':
                            return filteredPreismeldungen.filter(p => p.preismeldung.istAbgebucht);
                        case 'TODO':
                            return filteredPreismeldungen.filter(p => !p.preismeldung.istAbgebucht);
                        case 'ALL':
                            return filteredPreismeldungen;
                    }

                    return [];
                },
            ),
            combineLatest(currentPreismeldung$, (preismeldungen, currentPreismeldung) => {
                return !!currentPreismeldung &&
                    (currentPreismeldung.isNew || currentPreismeldung.isModified) &&
                    !preismeldungen.some(x => x.pmId === currentPreismeldung.pmId)
                    ? [currentPreismeldung, ...preismeldungen]
                    : preismeldungen;
            }),
            withLatestFrom(markedToMove$),
            map(([preismeldungen, markedToMove]) => {
                const firstDragableToIndex = findLastIndex(preismeldungen, bag => !!bag.preismeldung.uploadRequestedAt);
                return preismeldungen.map((bag, i) => ({
                    ...bag,
                    dragable: !bag.preismeldung.uploadRequestedAt,
                    dragableTo: i > firstDragableToIndex,
                    disableMove:
                        (markedToMove.length === 0 && i === firstDragableToIndex) ||
                        (markedToMove.length > 0 &&
                            (i <= firstDragableToIndex && markedToMove.indexOf(bag.pmId) === -1)),
                    lastUploaded: i === firstDragableToIndex,
                }));
            }),
            debounceTime(100),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
        this.noPreismeldungen$ = this.filteredPreismeldungen$.pipe(
            withLatestFrom(this.preismeldungen$, (filtered, preismeldungen) =>
                filtered.length === 0 && preismeldungen.length === 0
                    ? translateService.instant('label_no_preismeldung-available')
                    : filtered.length === 0
                    ? translateService.instant('label_no_preismeldung-with-current-filter')
                    : '',
            ),
        );

        this.noFavorites$ = this.filteredPreismeldungen$.pipe(
            map(preismeldungen => preismeldungen.filter(bag => bag.marked).length === 0),
            startWith(true),
        );

        this.saveOrder$ = this.dropPreismeldung$.pipe(
            merge(moveToPm$),
            withLatestFrom(this.filteredPreismeldungen$),
            takeUntil(this.onDestroy$),
            map(([{ dropBeforePmId, preismeldungPmId }, preismeldungen]) => {
                const dropedPm = preismeldungen.find(pm => pm.pmId === preismeldungPmId);
                const allPm = orderBy(preismeldungen, x => x.sortierungsnummer).filter(
                    pm => pm.pmId !== preismeldungPmId,
                );
                const dropIndex = !dropBeforePmId ? allPm.length : allPm.findIndex(pm => pm.pmId === dropBeforePmId);
                const listBeforeDrop = allPm.slice(0, dropIndex - 1);
                const prioritizedPm = [dropedPm, ...allPm.slice(dropIndex - 1)].map((pm, i) => ({
                    ...pm,
                    priority: i + 1,
                }));
                const dropPreismeldungBeforePriority = !dropBeforePmId
                    ? Number.MAX_VALUE
                    : prioritizedPm.find(b => b.pmId === dropBeforePmId).priority;

                const preismeldungenTemp = prioritizedPm.map(b =>
                    b.pmId === preismeldungPmId ? { ...b, priority: dropPreismeldungBeforePriority - 0.1 } : b,
                );

                let minSortNummer = minBy(
                    prioritizedPm.filter(pm => pm.pmId !== preismeldungPmId),
                    pm => pm.sortierungsnummer,
                ).sortierungsnummer;
                const sortedPm = orderBy(preismeldungenTemp, x => x.priority);
                const lastSaisonalPmIndex = takeWhile(sortedPm, x => x.sortierungsnummer === 0).length - 1;

                // If the last saisonal pm has been moved use sortnummer 1
                if (minSortNummer === 0 && sortedPm[0] && sortedPm[0].sortierungsnummer !== 0) {
                    minSortNummer = 1;
                }

                return {
                    sortOrder: [
                        ...listBeforeDrop.map(({ pmId, sortierungsnummer }) => ({ pmId, sortierungsnummer })),
                        ...sortedPm.map((b, i) => {
                            const pm =
                                i > lastSaisonalPmIndex
                                    ? {
                                          pmId: b.pmId,
                                          sortierungsnummer:
                                              Math.round(minSortNummer) +
                                              i -
                                              (lastSaisonalPmIndex > 0 ? lastSaisonalPmIndex : 0),
                                      }
                                    : b;
                            return { pmId: pm.pmId, sortierungsnummer: pm.sortierungsnummer };
                        }),
                    ],
                };
            }),
        );

        const selectFirstPreismeldung$ = this.filteredPreismeldungen$.pipe(
            withLatestFrom(this.currentPreismeldung$, (filteredPreismeldungen, currentPreismeldung) => {
                if (
                    !!currentPreismeldung &&
                    (currentPreismeldung.isNew || filteredPreismeldungen.some(x => x.pmId === currentPreismeldung.pmId))
                )
                    return null;
                return filteredPreismeldungen[0];
            }),
            filter(x => !!x),
        );

        const selectNoPreismeldung$ = this.filteredPreismeldungen$.pipe(
            withLatestFrom(this.currentPreismeldung$, (filteredPreismeldungen, currentPreismeldung) => {
                return filteredPreismeldungen.length === 0 && !!currentPreismeldung && !currentPreismeldung.isModified;
            }),
            filter(x => x),
        );

        const requestSelectNextPreismeldung$ = this.observePropertyCurrentValue<{}>(
            'requestSelectNextPreismeldung',
        ).pipe(filter(x => !!x));

        const selectNext$ = this.selectNextPreismeldung$.pipe(
            merge(requestSelectNextPreismeldung$),
            withLatestFrom(
                this.currentPreismeldung$,
                this.filteredPreismeldungen$,
                (_, currentPreismeldung: P.PreismeldungBag, filteredPreismeldungen: P.PreismeldungBag[]) => {
                    if (!currentPreismeldung) return filteredPreismeldungen[0];
                    const currentPreismeldungIndex = filteredPreismeldungen.findIndex(
                        x => x.pmId === currentPreismeldung.pmId,
                    );
                    if (currentPreismeldungIndex === filteredPreismeldungen.length - 1)
                        return filteredPreismeldungen[0];
                    return filteredPreismeldungen[currentPreismeldungIndex + 1];
                },
            ),
        );

        const selectPrev$ = this.selectPrevPreismeldung$.pipe(
            withLatestFrom(
                this.currentPreismeldung$,
                this.filteredPreismeldungen$,
                (_, currentPreismeldung: P.PreismeldungBag, filteredPreismeldungen: P.PreismeldungBag[]) => {
                    if (!currentPreismeldung) return filteredPreismeldungen[filteredPreismeldungen.length - 1];
                    const currentPreismeldungIndex = filteredPreismeldungen.findIndex(
                        x => x.pmId === currentPreismeldung.pmId,
                    );
                    if (currentPreismeldungIndex === 0)
                        return filteredPreismeldungen[filteredPreismeldungen.length - 1];
                    return filteredPreismeldungen[currentPreismeldungIndex - 1];
                },
            ),
        );

        const keyMap = {
            38: -1, // Up
            40: 1, // Down
        };
        const selectNextByArrowKeys$ = fromEvent(wndw.document, 'keydown').pipe(
            filter(
                (e: KeyboardEvent) =>
                    !['input', 'textarea'].some(tag => (e.target as HTMLElement).tagName.toLocaleLowerCase() === tag),
            ),
            map((e: KeyboardEvent) => keyMap[e.keyCode]),
            filter(x => x !== undefined),
            withLatestFrom(this.currentPreismeldung$, this.filteredPreismeldungen$),
            map(
                ([next, currentPm, preismeldungen]) =>
                    preismeldungen[preismeldungen.findIndex(pm => pm.pmId === currentPm.pmId) + next],
            ),
            distinctUntilChanged(),
            filter(x => x !== undefined),
        );

        this.selectPreismeldung$ = this.selectClickedPreismeldung$.pipe(
            merge(selectNext$),
            merge(selectPrev$),
            merge(selectNextByArrowKeys$),
            merge(selectFirstPreismeldung$),
            merge(selectNoPreismeldung$.pipe(map(() => null))),
            publishReplay(1),
            refCount(),
        );

        this.currentPreismeldung$
            .pipe(
                // combineLatest here is being used as event handlers instead of listening to filteredPreismeldungen$
                // because this stream also listens to markedPreismeldungen$.
                combineLatest(this.preismeldungen$, filterChanged$, selectFilter$, sortByErhebungsschema$, bag => bag),
                delay(200),
                withLatestFrom(this.filteredPreismeldungen$, this.ionItemHeight$.asObservable()),
                takeUntil(this.onDestroy$),
            )
            .subscribe(([bag, filteredPreismeldungen, ionItemHeight]) => {
                if (!bag) return;
                const index = filteredPreismeldungen.findIndex(y => y.pmId === bag.pmId);
                if (index < 0) return;
                const d = this.virtualScroll.calculateDimensions();
                if ((index + 1) * ionItemHeight > this.virtualScroll.element.nativeElement.scrollTop + d.viewHeight) {
                    this.virtualScroll.element.nativeElement.scrollTop = (index + 1) * ionItemHeight - d.viewHeight;
                    this.virtualScroll.refresh();
                }
                if (index * ionItemHeight < this.virtualScroll.element.nativeElement.scrollTop) {
                    this.virtualScroll.element.nativeElement.scrollTop = index * ionItemHeight;
                    this.virtualScroll.refresh();
                }
            });

        this.completedCount$ = this.preismeldungen$.pipe(
            map(x => `${x.filter(y => y.preismeldung.istAbgebucht).length}/${x.length}`),
        );
    }

    formatPercentageChange = (preismeldung: P.Models.Preismeldung) => {
        return preismeldung.d_DPToVPK != null &&
            preismeldung.d_DPToVPK.percentage != null &&
            !isNaN(preismeldung.d_DPToVPK.percentage)
            ? formatPercentageChange(preismeldung.d_DPToVPK.percentage, 1)
            : formatPercentageChange(preismeldung.d_DPToVP.percentage, 1);
    };

    getBearbeitungscodeDescription(bearbeitungscode: P.Models.Bearbeitungscode) {
        return P.Models.bearbeitungscodeDescriptions[bearbeitungscode];
    }

    calcStichtagStatus(bag: P.PreismeldungBag, currentDate: Date) {
        if (!bag.refPreismeldung) return null;
        const erhebungsAnfangsDatum = parseDate(bag.refPreismeldung.erhebungsAnfangsDatum);
        const erhebungsEndDatum = parseDate(bag.refPreismeldung.erhebungsEndDatum);
        if (isBefore(currentDate, erhebungsAnfangsDatum)) return 'gray';
        if (isAfter(currentDate, erhebungsAnfangsDatum) && isBefore(currentDate, subMilliseconds(erhebungsEndDatum, 1)))
            return 'green';
        if (
            isAfter(currentDate, erhebungsEndDatum) &&
            isBefore(currentDate, subMilliseconds(addDays(erhebungsEndDatum, 1), 1))
        )
            return 'orange';
        if (isAfter(currentDate, subMilliseconds(addDays(erhebungsEndDatum, 1), 1))) return 'red';
        return 'green';
    }

    trackByFn(_index: number, item: P.PreismeldungBag) {
        return item.pmId;
    }

    public ngAfterViewInit() {
        [this.drake, this.scroll] = initDragula(this.pmList.nativeElement, {
            markerSelector: '.item.md',
            delayedGrab: true,
            dragulaOptions: {
                moves: (el, container) =>
                    el.classList.contains(DRAGABLE_CLASS) && container.parentElement.classList.contains('can-reorder'),
                accepts: (_el, _target, _source, sibling) => {
                    return !sibling || sibling.classList.contains(DRAGTOABLE_CLASS);
                },
            },
            onDrop: args => this.dropPreismeldung$.emit(args),
        });
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.onDestroy$.next();
        this.drake.destroy();
        this.scroll.destroy();
    }
}

const toColor = (x: boolean) => (x ? 'blue-chill' : 'wild-sand');
