import {
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
import { addDays, isAfter, isBefore, subMilliseconds } from 'date-fns';
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

@Component({
    selector: 'preismeldung-list',
    templateUrl: 'preismeldung-list.html',
    styleUrls: ['preismeldung-list.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungListComponent extends ReactiveComponent implements OnChanges, OnDestroy {
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
    @Output('filteredPreismeldungen') filteredPreismeldungen$: Observable<(P.PreismeldungBag & { marked: boolean })[]>;

    @ViewChild(PefVirtualScrollComponent, { static: true }) private virtualScroll: any;

    public selectClickedPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    public selectNextPreismeldung$ = new EventEmitter();
    public selectPrevPreismeldung$ = new EventEmitter();
    public activateReordering$ = new EventEmitter<HammerInput>();
    public reordered$ = new EventEmitter<CustomEvent<ItemReorderEventDetail>>();

    public viewPortItems: P.Models.Preismeldung[];
    public scrollList: P.PreismeldungBag[];
    public completedCount$: Observable<string>;
    public isReorderingActive$: Observable<boolean>;

    public filterText$ = new EventEmitter<string>();

    public selectFilterClicked$ = new EventEmitter<Filters>();

    public selectFilter$: Observable<Filters>;
    public filterTodoColor$: Observable<string>;
    public filterCompletedColor$: Observable<string>;
    public filterAllColor$: Observable<string>;
    public filterFavoritesColor$: Observable<string>;

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

        this.handleFilters();

        const currentPreismeldung$ = this.currentPreismeldung$.pipe(
            withLatestFrom(markedPreismeldungen$),
            map(([bag, markedIds]) => (bag ? { ...bag, marked: markedIds.some(id => id === bag.pmId) } : null)),
        );
        const [filterFavorites$, filterStatus$] = this.getFilters();
        this.filterFavoritesColor$ = filterFavorites$.pipe(map(x => (x ? 'blue-chill' : 'wild-sand')));

        this.filteredPreismeldungen$ = this.preismeldungen$.pipe(
            combineLatest(markedPreismeldungen$, (preismeldungen, markedIds) =>
                preismeldungen.map(bag => ({ ...bag, marked: markedIds.lastIndexOf(bag.pmId) !== -1 })),
            ),
            combineLatest(
                this.filterText$.pipe(startWith('')),
                filterStatus$,
                filterFavorites$,
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
            debounceTime(100),
            publishReplay(1),
            refCount(),
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

    trackByFn(index: number, item: P.PreismeldungBag) {
        if (item) return index;
        return `${item.pmId}_${item.preismeldung.modifiedAt || ''}`;
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }

    private handleFilters() {
        this.selectFilter$ = this.selectFilterClicked$.pipe(
            startWith('ALL' as Filters),
            publishReplay(1),
            refCount(),
        );
        const { ALL, COMPLETED, TODO } = (['ALL', 'COMPLETED', 'TODO'] as Filters[]).reduce(
            (filters, f) => ({
                ...filters,
                [f]: this.selectFilter$.pipe(
                    filter(x => x !== 'FAVORITES'),
                    startWith(false),
                    map(x => (x === f ? 'blue-chill' : 'wild-sand')),
                ),
            }),
            {} as Record<Filters, Observable<string>>,
        );
        this.filterTodoColor$ = TODO;
        this.filterCompletedColor$ = COMPLETED;
        this.filterAllColor$ = ALL;
    }

    private getFilters() {
        const [favorites$, statusFilters$] = partition(this.selectFilter$, filters => filters === 'FAVORITES');
        return [
            favorites$.pipe(
                scan(acc => !acc, false),
                startWith(false),
            ),
            statusFilters$,
        ] as [Observable<boolean>, Observable<Exclude<Filters, 'FAVORITES'>>];
    }
}
