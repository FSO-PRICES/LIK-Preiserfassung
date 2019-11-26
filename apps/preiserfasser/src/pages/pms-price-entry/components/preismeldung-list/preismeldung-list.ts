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
} from '@angular/core';
import { IonContent } from '@ionic/angular';
import { ItemReorderEventDetail } from '@ionic/core';
import { TranslateService } from '@ngx-translate/core';
import { addDays, isAfter, isBefore, subMilliseconds } from 'date-fns';
import autoScroll from 'dom-autoscroller';
import dragula from 'dragula';
import { findLastIndex, minBy, orderBy, sortBy, takeWhile } from 'lodash';
import { Observable, Subject } from 'rxjs';
import {
    combineLatest,
    debounceTime,
    delay,
    filter,
    map,
    merge,
    publishReplay,
    refCount,
    scan,
    startWith,
    takeUntil,
    withLatestFrom,
} from 'rxjs/operators';

import {
    formatPercentageChange,
    initDragula,
    parseDate,
    partition,
    pefSearch,
    PefVirtualScrollComponent,
    ReactiveComponent,
} from '@lik-shared';

import * as P from '../../../../common-models';

type Filters = 'TODO' | 'COMPLETED' | 'ALL' | 'FAVORITES';
type DropPreismeldungArg = { preismeldungPmId: string; dropBeforePmId: string };
type AdvancedPreismeldungBag = P.PreismeldungBag & {
    marked: boolean;
    dragable: boolean;
    dragableTo: boolean;
    lastUploaded: boolean;
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

    private drake: dragula.Drake;
    private scroll: any;

    public filterText$ = new EventEmitter<string>();
    public selectFilterClicked$ = new EventEmitter<Filters>();
    public sortErhebungsschemaClicked$ = new EventEmitter();
    public dropPreismeldung$ = new EventEmitter<DropPreismeldungArg>();

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

    constructor(translateService: TranslateService) {
        super();

        this.ionItemHeight$.asObservable().subscribe(itemHeight => (this.itemHeight = itemHeight));

        this.currentDate$.pipe(takeUntil(this.onDestroy$)).subscribe();
        this.isReorderingActive$ = this.activateReordering$.pipe(
            scan(prev => !prev, false),
            startWith(false),
            publishReplay(1),
            refCount(),
        );
        this.reordered$.pipe(takeUntil(this.onDestroy$)).subscribe(x => x.detail.complete());

        const markedPreismeldungen$ = this.markedPreismeldungen$.pipe(startWith([]));

        const selectFilter$ = this.selectFilterClicked$.pipe(
            startWith('ALL' as Filters),
            publishReplay(1),
            refCount(),
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

        const currentPreismeldung$ = this.currentPreismeldung$.pipe(
            withLatestFrom(markedPreismeldungen$),
            map(([bag, markedIds]) => (bag ? { ...bag, marked: markedIds.some(id => id === bag.pmId) } : null)),
        );

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
        this.startDrag$.pipe(takeUntil(this.onDestroy$)).subscribe(evt => (this.drake as any).grab(evt));

        this.filteredPreismeldungen$ = this.preismeldungen$.pipe(
            combineLatest(sortByErhebungsschema$, (preismeldungen, sortByErhebungsschema) =>
                sortByErhebungsschema
                    ? sortBy(
                          preismeldungen,
                          bag => bag.warenkorbPosition.index + parseInt(bag.preismeldung.laufnummer, 10) * 0.01,
                      )
                    : preismeldungen,
            ),
            combineLatest(markedPreismeldungen$, (preismeldungen, markedIds) =>
                preismeldungen.map(bag => ({ ...bag, marked: markedIds.lastIndexOf(bag.pmId) !== -1 })),
            ),
            combineLatest(
                this.filterText$.pipe(startWith('')),
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
            map(preismeldungen => {
                const firstDragableToIndex = findLastIndex(preismeldungen, bag => !!bag.preismeldung.uploadRequestedAt);
                return preismeldungen.map((bag, i) => ({
                    ...bag,
                    dragable: !bag.preismeldung.uploadRequestedAt,
                    dragableTo: i > firstDragableToIndex,
                    lastUploaded: i === firstDragableToIndex,
                }));
            }),
            debounceTime(100),
            publishReplay(1),
            refCount(),
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

        this.selectPreismeldung$ = this.selectClickedPreismeldung$.pipe(
            merge(selectNext$),
            merge(selectPrev$),
            merge(selectFirstPreismeldung$),
            merge(selectNoPreismeldung$.pipe(map(() => null))),
            publishReplay(1),
            refCount(),
        );

        this.currentPreismeldung$
            .pipe(
                combineLatest(this.filteredPreismeldungen$, (bag, filteredPreismeldungen) => ({
                    bag,
                    filteredPreismeldungen,
                })),
                withLatestFrom(this.ionItemHeight$, (x, ionItemHeight: number) => ({
                    bag: x.bag,
                    filteredPreismeldungen: x.filteredPreismeldungen,
                    ionItemHeight,
                })),
                delay(100),
                takeUntil(this.onDestroy$),
            )
            .subscribe(x => {
                if (!x.bag) return;
                const index = x.filteredPreismeldungen.findIndex(y => y.pmId === x.bag.pmId);
                if (index < 0) return;
                const d = this.virtualScroll.calculateDimensions();
                if ((index + 1) * x.ionItemHeight > this.virtualScroll.element.nativeElement.scrollTop + d.viewHeight) {
                    this.virtualScroll.element.nativeElement.scrollTop = (index + 1) * x.ionItemHeight - d.viewHeight;
                    this.virtualScroll.refresh();
                }
                if (index * x.ionItemHeight < this.virtualScroll.element.nativeElement.scrollTop) {
                    this.virtualScroll.element.nativeElement.scrollTop = index * x.ionItemHeight;
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
