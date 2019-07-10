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
import { addDays, isAfter, isBefore, subMilliseconds } from 'date-fns';
import { Observable, Subject } from 'rxjs';
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
    startWith,
    takeUntil,
    tap,
    withLatestFrom,
} from 'rxjs/operators';

import {
    formatPercentageChange,
    parseDate,
    pefSearch,
    PefVirtualScrollComponent,
    ReactiveComponent,
} from '@lik-shared';

import * as P from '../../../../common-models';

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

    @ViewChild(PefVirtualScrollComponent, { static: true }) private virtualScroll: any;

    public selectClickedPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    public selectNextPreismeldung$ = new EventEmitter();
    public selectPrevPreismeldung$ = new EventEmitter();

    public viewPortItems: P.Models.Preismeldung[];
    public filteredPreismeldungen$: Observable<(P.PreismeldungBag & { marked: boolean })[]>;
    public scrollList: P.PreismeldungBag[];
    public completedCount$: Observable<string>;

    public filterText$ = new EventEmitter<string>();

    public selectFilterTodo$ = new EventEmitter();
    public selectFilterCompleted$ = new EventEmitter();

    public filterTodoSelected$: Observable<boolean>;
    public filterTodoColor$: Observable<string>;
    public filterCompletedSelected$: Observable<boolean>;
    public filterCompletedColor$: Observable<string>;

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

        const filterStatus$ = this.selectFilterTodo$.pipe(
            mapTo('TODO'),
            merge(this.selectFilterCompleted$.pipe(mapTo('COMPLETED'))),
            scan(
                (agg, v) => {
                    if (v === 'TODO') {
                        if (!agg.todo && agg.completed) return { todo: true, completed: true };
                        return { todo: false, completed: true };
                    }
                    if (v === 'COMPLETED') {
                        if (!agg.completed && agg.todo) return { todo: true, completed: true };
                        return { todo: true, completed: false };
                    }
                },
                { todo: true, completed: true },
            ),
            startWith({ todo: true, completed: true }),
            publishReplay(1),
            refCount(),
        );

        const markedPreismeldungen$ = this.favorite$.asObservable().pipe(
            scan(
                (markedIds, bag) => (bag.marked ? markedIds.filter(id => id !== bag.pmId) : [...markedIds, bag.pmId]),
                [] as string[],
            ),
            startWith([]),
        );

        this.filterTodoSelected$ = filterStatus$.pipe(map(x => x.todo));
        this.filterTodoColor$ = filterStatus$.pipe(map(x => (x.todo ? 'blue-chill' : 'wild-sand')));
        this.filterCompletedSelected$ = filterStatus$.pipe(map(x => x.completed));
        this.filterCompletedColor$ = filterStatus$.pipe(map(x => (x.completed ? 'blue-chill' : 'wild-sand')));

        this.filteredPreismeldungen$ = this.preismeldungen$.pipe(
            combineLatest(
                this.filterText$.pipe(startWith('')),
                filterStatus$,
                this.currentLanguage$,
                (
                    preismeldungen: P.PreismeldungBag[],
                    filterText: string,
                    filterStatus: { todo: boolean; completed: boolean },
                    currentLanguage: string,
                ) => {
                    let filteredPreismeldungen: P.PreismeldungBag[];

                    if (!filterText || filterText.length === 0) {
                        filteredPreismeldungen = preismeldungen;
                    } else {
                        filteredPreismeldungen = pefSearch(filterText, preismeldungen, [
                            pm => pm.warenkorbPosition.gliederungspositionsnummer,
                            pm => pm.warenkorbPosition.positionsbezeichnung[currentLanguage],
                            pm => pm.preismeldung.artikeltext,
                        ]);
                    }

                    if (filterStatus.todo && filterStatus.completed) return filteredPreismeldungen;

                    if (filterStatus.todo) return filteredPreismeldungen.filter(p => !p.preismeldung.istAbgebucht);
                    if (filterStatus.completed) return filteredPreismeldungen.filter(p => p.preismeldung.istAbgebucht);

                    return [];
                },
            ),
            combineLatest(this.currentPreismeldung$, (preismeldungen, currentPreismeldung) => {
                return !!currentPreismeldung &&
                    (currentPreismeldung.isNew || currentPreismeldung.isModified) &&
                    !preismeldungen.some(x => x.pmId === currentPreismeldung.pmId)
                    ? [currentPreismeldung as P.PreismeldungBag].concat(preismeldungen)
                    : preismeldungen;
            }),
            combineLatest(markedPreismeldungen$, (preismeldungen, markedIds) =>
                preismeldungen.map(bag => ({ ...bag, marked: markedIds.lastIndexOf(bag.pmId) !== -1 })),
            ),
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
}
