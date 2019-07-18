import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChange,
    ViewChild,
} from '@angular/core';
import { IonContent } from '@ionic/angular';
import { ItemReorderEventDetail } from '@ionic/core';
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
    parseDate,
    partition,
    pefSearch,
    PefVirtualScrollComponent,
    ReactiveComponent,
} from '@lik-shared';

import * as P from '../../../../common-models';

type Filters = 'TODO' | 'COMPLETED' | 'ALL' | 'FAVORITES';
type SelectFilters = Exclude<Filters, 'FAVORITES'>;
type DropPreismeldungArg = { preismeldungPmId: string; dropBeforePmId: string };
const DRAGABLE_CLASS = 'dragable-item';

@Component({
    selector: 'preismeldung-list',
    templateUrl: 'preismeldung-list.html',
    styleUrls: ['preismeldung-list.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungListComponent extends ReactiveComponent implements OnInit, OnChanges, OnDestroy {
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
    @Output('selectPreismeldung') selectPreismeldung$: Observable<P.PreismeldungBag>;
    @Output('addNewPreisreihe') addNewPreisreihe$ = new EventEmitter();
    @Output('sortPreismeldungen') sortPreismeldungen$ = new EventEmitter();
    @Output('recordSortPreismeldungen') recordSortPreismeldungen$ = new EventEmitter();
    @Output('filteredPreismeldungen') filteredPreismeldungen$: Observable<
        (P.PreismeldungBag & { marked: boolean; dragable: boolean; lastUploaded: boolean })[]
    >;
    @Output('saveOrder') saveOrder$: Observable<P.Models.PmsPreismeldungenSortProperties>;

    @ViewChild(PefVirtualScrollComponent, { static: true }) private virtualScroll: any;
    @ViewChild('pmList', { static: true, read: ElementRef }) private pmList: ElementRef;

    public selectClickedPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    public selectNextPreismeldung$ = new EventEmitter();
    public selectPrevPreismeldung$ = new EventEmitter();
    public activateReordering$ = new EventEmitter<HammerInput>();
    public startDrag$ = new EventEmitter<MouseEvent | TouchEvent>();
    public reordered$ = new EventEmitter<CustomEvent<ItemReorderEventDetail>>();

    public viewPortItems: P.Models.Preismeldung[];
    public scrollList: P.PreismeldungBag[];
    public completedCount$: Observable<string>;
    public isReorderingActive$: Observable<boolean>;

    private drake: dragula.Drake;
    private scroll: any;

    public filterText$ = new EventEmitter<string>();
    public selectFilterClicked$ = new EventEmitter<Filters>();
    public sortErhebungsschemaClicked$ = new EventEmitter();
    public dropPreismeldung$ = new EventEmitter<DropPreismeldungArg>();
    public onDrag$ = new EventEmitter();

    public filterTodoColor$: Observable<string>;
    public filterCompletedColor$: Observable<string>;
    public filterAllColor$: Observable<string>;
    public filterFavoritesColor$: Observable<string>;
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

    public ionItemHeight$ = new EventEmitter<number>();
    public favorite$ = new EventEmitter<P.PreismeldungBag & { marked: boolean }>();
    public itemHeight = 50;

    private onDestroy$ = new Subject();

    constructor() {
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

        const markedPreismeldungen$ = this.favorite$.asObservable().pipe(
            scan(
                (markedIds, bag) => (bag.marked ? markedIds.filter(id => id !== bag.pmId) : [...markedIds, bag.pmId]),
                [] as string[],
            ),
            startWith([]),
        );

        const [selectFilter$, favoritesFilter$] = partition(
            this.selectFilterClicked$.pipe(
                startWith('ALL' as Filters),
                publishReplay(1),
                refCount(),
            ),
            f => f !== 'FAVORITES',
        ) as [Observable<SelectFilters>, Observable<boolean>];
        const isFilter = (f: SelectFilters) =>
            selectFilter$.pipe(
                startWith(false),
                map(x => x === f),
            );
        const filterAll$ = isFilter('ALL');
        const filterCompleted$ = isFilter('COMPLETED');
        const filterTodo$ = isFilter('TODO');

        const filterByFavorites$ = favoritesFilter$.pipe(
            scan(acc => !acc, false),
            startWith(false),
            publishReplay(1),
            refCount(),
        );

        this.filterTodoColor$ = filterTodo$.pipe(map(toColor));
        this.filterCompletedColor$ = filterCompleted$.pipe(map(toColor));
        this.filterAllColor$ = filterAll$.pipe(map(toColor));
        this.filterFavoritesColor$ = filterByFavorites$.pipe(map(toColor));

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
                filterByFavorites$,
                sortByErhebungsschema$,
                (all, favorites, sortByErhebungsschema) => all && !favorites && !sortByErhebungsschema,
            ),
            publishReplay(1),
            refCount(),
        );
        this.startDrag$.pipe(takeUntil(this.onDestroy$)).subscribe(evt => {
            console.log('starting drag?', evt);
            (this.drake as any).grab(evt);
        });

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
                filterByFavorites$,
                this.currentLanguage$,
                (preismeldungen, filterText, filterStatus, filterFavorites, currentLanguage) => {
                    let filteredPreismeldungen = preismeldungen;

                    if (filterText && filterText.length > 0) {
                        filteredPreismeldungen = pefSearch(filterText, preismeldungen, [
                            pm => pm.warenkorbPosition.gliederungspositionsnummer,
                            pm => pm.warenkorbPosition.positionsbezeichnung[currentLanguage],
                            pm => pm.preismeldung.artikeltext,
                        ]);
                    }

                    if (filterFavorites) filteredPreismeldungen = filteredPreismeldungen.filter(bag => bag.marked);

                    if (filterStatus === 'ALL') return filteredPreismeldungen;

                    if (filterStatus === 'COMPLETED')
                        return filteredPreismeldungen.filter(p => !p.preismeldung.istAbgebucht);

                    if (filterStatus === 'TODO') return filteredPreismeldungen.filter(p => p.preismeldung.istAbgebucht);

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
                const firstDragableIndex = findLastIndex(preismeldungen, bag => !!bag.preismeldung.uploadRequestedAt);
                return preismeldungen.map((bag, i) => ({
                    ...bag,
                    dragable: i >= firstDragableIndex,
                    lastUploaded: i === firstDragableIndex,
                }));
            }),
            debounceTime(100),
            publishReplay(1),
            refCount(),
        );

        this.saveOrder$ = this.dropPreismeldung$.pipe(
            withLatestFrom(this.filteredPreismeldungen$),
            takeUntil(this.onDestroy$),
            map(([dropPm, preismeldungen]) => {
                const { dropBeforePmId, preismeldungPmId } = dropPm;

                const prioritizedPm = orderBy(preismeldungen, x => x.sortierungsnummer).map((pm, i) => ({
                    ...pm,
                    priority: i + 1,
                }));
                const dropPreismeldungBeforePriority = !dropBeforePmId
                    ? Number.MAX_VALUE
                    : prioritizedPm.find(b => b.pmId === dropBeforePmId).priority;

                const preismeldungenTemp = prioritizedPm.map(b =>
                    b.pmId === preismeldungPmId ? { ...b, priority: dropPreismeldungBeforePriority - 0.1 } : b,
                );

                let minSortNummer = minBy(prioritizedPm, pm => pm.sortierungsnummer).sortierungsnummer;
                const sortedPm = orderBy(preismeldungenTemp, x => x.priority);
                const lastSaisonalPmIndex = takeWhile(sortedPm, x => x.sortierungsnummer === 0).length - 1;

                // If the last saisonal pm has been moved use sortnummer 1
                if (minSortNummer === 0 && sortedPm[0] && sortedPm[0].sortierungsnummer !== 0) {
                    minSortNummer = 1;
                }

                return {
                    sortOrder: sortedPm.map((b, i) => {
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

    public ngOnInit() {
        const thatDrake = (this.drake = dragula(
            [this.pmList.nativeElement.querySelector('pef-virtual-scroll > div.scrollable-content')],
            {
                moves: (el, container) =>
                    el.classList.contains(DRAGABLE_CLASS) && container.parentElement.classList.contains('can-reorder'),
                accepts: (_el, _target, _source, sibling) => {
                    return (
                        !sibling ||
                        (sibling.classList.contains(DRAGABLE_CLASS) &&
                            !sibling.classList.contains('last-uploaded-item'))
                    );
                },
                dragDelay: 500,
            } as dragula.DragulaOptions,
        ));
        thatDrake.on('drop', (el, _target, _source, sibling) => {
            const siblingPmId = !!sibling ? sibling.dataset.pmid : null;
            this.dropPreismeldung$.emit({ preismeldungPmId: el.dataset.pmid, dropBeforePmId: siblingPmId });
        });
        thatDrake.on('drag', () => {
            return this.onDrag$.emit();
        });
        thatDrake.on('dragend', () => {
            this.pmList.nativeElement.classList.remove('is-dragging');
        });
        this.scroll = autoScroll([this.pmList.nativeElement], {
            margin: 30,
            maxSpeed: 25,
            scrollWhenOutside: true,
            autoScroll: function() {
                return this.down && thatDrake.dragging;
            },
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
