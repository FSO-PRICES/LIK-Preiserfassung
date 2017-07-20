import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ViewChild, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Content } from 'ionic-angular';
import { Observable } from 'rxjs';
import { isBefore, isAfter, addDays, subMilliseconds } from 'date-fns';

import { ReactiveComponent, formatPercentageChange, pefSearch, PefVirtualScrollComponent } from 'lik-shared';

import * as P from '../../../../common-models';

@Component({
    selector: 'preismeldung-list',
    templateUrl: 'preismeldung-list.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldungListComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @ViewChild(Content) content: Content;
    @Input() isDesktop: boolean;
    @Input() currentTime: Date;
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Input() currentLanguage: string;
    @Input() preismeldungen: P.PreismeldungBag[];
    @Input() currentPreismeldung: P.CurrentPreismeldungBag;
    @Input() requestSelectNextPreismeldung: {};
    @Output('selectPreismeldung') selectPreismeldung$: Observable<P.PreismeldungBag>;
    @Output('addNewPreisreihe') addNewPreisreihe$ = new EventEmitter();

    @ViewChild(PefVirtualScrollComponent)
    private virtualScroll: any;

    public selectClickedPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    public selectNextPreismeldung$ = new EventEmitter();
    public selectPrevPreismeldung$ = new EventEmitter();

    public viewPortItems: P.Models.Preismeldung[];
    public filteredPreismeldungen$: Observable<P.PreismeldungBag[]>;
    public scrollList: P.PreismeldungBag[];
    public completedCount$: Observable<string>;

    public filterText$ = new EventEmitter<string>();

    public selectFilterTodo$ = new EventEmitter();
    public selectFilterCompleted$ = new EventEmitter();

    public filterTodoSelected$: Observable<boolean>;
    public filterCompletedSelected$: Observable<boolean>;

    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle');
    public currentLanguage$ = this.observePropertyCurrentValue<string>('currentLanguage');
    public currentPreismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('currentPreismeldung').publishReplay(1).refCount();
    public currentTime$ = this.observePropertyCurrentValue<Date>('currentTime').publishReplay(1).refCount();
    private preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen');

    public ionItemHeight$ = new EventEmitter<number>();
    public itemHeight = 50;

    private subscriptions = [];

    constructor() {
        super();

        this.ionItemHeight$.subscribe(itemHeight => this.itemHeight = itemHeight);

        this.subscriptions.push(this.currentTime$.subscribe());

        const filterStatus$ =
            this.selectFilterTodo$.mapTo('TODO').merge(this.selectFilterCompleted$.mapTo('COMPLETED'))
                .scan((agg, v) => {
                    if (v === 'TODO') {
                        if (!agg.todo && agg.completed) return { todo: true, completed: true };
                        return { todo: false, completed: true };
                    }
                    if (v === 'COMPLETED') {
                        if (!agg.completed && agg.todo) return { todo: true, completed: true };
                        return { todo: true, completed: false };
                    }
                }, { todo: true, completed: true })
                .startWith({ todo: true, completed: true })
                .publishReplay(1).refCount();

        this.filterTodoSelected$ = filterStatus$.map(x => x.todo);
        this.filterCompletedSelected$ = filterStatus$.map(x => x.completed);

        this.filteredPreismeldungen$ = this.preismeldungen$
            .combineLatest(this.filterText$.startWith(''), filterStatus$, this.currentLanguage$, (preismeldungen: P.PreismeldungBag[], filterText: string, filterStatus: { todo: boolean, completed: boolean }, currentLanguage: string) => {
                let filteredPreismeldungen: P.PreismeldungBag[];

                if (!filterText || filterText.length === 0) {
                    filteredPreismeldungen = preismeldungen;
                } else {
                    filteredPreismeldungen = pefSearch(filterText, preismeldungen, [pm => pm.warenkorbPosition.gliederungspositionsnummer, pm => pm.warenkorbPosition.positionsbezeichnung[currentLanguage], pm => pm.preismeldung.artikeltext]);
                }

                if (filterStatus.todo && filterStatus.completed) return filteredPreismeldungen;

                if (filterStatus.todo) return filteredPreismeldungen.filter(p => !p.preismeldung.istAbgebucht);
                if (filterStatus.completed) return filteredPreismeldungen.filter(p => p.preismeldung.istAbgebucht);

                return [];
            })
            .combineLatest(this.currentPreismeldung$, (preismeldungen, currentPreismeldung) => {
                return !!currentPreismeldung && (currentPreismeldung.isNew || currentPreismeldung.isModified) && !preismeldungen.some(x => x.pmId === currentPreismeldung.pmId) ? [(currentPreismeldung as P.PreismeldungBag)].concat(preismeldungen) : preismeldungen;
            })
            .debounceTime(100)
            .publishReplay(1).refCount();

        const selectFirstPreismeldung$ = this.filteredPreismeldungen$
            .withLatestFrom(this.currentPreismeldung$, (filteredPreismeldungen, currentPreismeldung) => {
                if (!!currentPreismeldung && (currentPreismeldung.isNew || filteredPreismeldungen.some(x => x.pmId === currentPreismeldung.pmId))) return null;
                return filteredPreismeldungen[0];
            })
            .filter(x => !!x);

        const selectNoPreismeldung$ = this.filteredPreismeldungen$
            .withLatestFrom(this.currentPreismeldung$, (filteredPreismeldungen, currentPreismeldung) => {
                return filteredPreismeldungen.length === 0 && !!currentPreismeldung && !currentPreismeldung.isModified;
            })
            .filter(x => x);

        const requestSelectNextPreismeldung$ = this.observePropertyCurrentValue<{}>('requestSelectNextPreismeldung').filter(x => !!x);
        const selectNext$ = this.selectNextPreismeldung$.merge(requestSelectNextPreismeldung$)
            .withLatestFrom(this.currentPreismeldung$, this.filteredPreismeldungen$, (_, currentPreismeldung: P.PreismeldungBag, filteredPreismeldungen: P.PreismeldungBag[]) => {
                if (!currentPreismeldung) return filteredPreismeldungen[0];
                const currentPreismeldungIndex = filteredPreismeldungen.findIndex(x => x.pmId === currentPreismeldung.pmId);
                if (currentPreismeldungIndex === filteredPreismeldungen.length - 1) return filteredPreismeldungen[0];
                return filteredPreismeldungen[currentPreismeldungIndex + 1];
            });

        const selectPrev$ = this.selectPrevPreismeldung$
            .withLatestFrom(this.currentPreismeldung$, this.filteredPreismeldungen$, (_, currentPreismeldung: P.PreismeldungBag, filteredPreismeldungen: P.PreismeldungBag[]) => {
                if (!currentPreismeldung) return filteredPreismeldungen[filteredPreismeldungen.length - 1];
                const currentPreismeldungIndex = filteredPreismeldungen.findIndex(x => x.pmId === currentPreismeldung.pmId);
                if (currentPreismeldungIndex === 0) return filteredPreismeldungen[filteredPreismeldungen.length - 1];
                return filteredPreismeldungen[currentPreismeldungIndex - 1];
            });

        this.selectPreismeldung$ = this.selectClickedPreismeldung$.merge(selectNext$).merge(selectPrev$).merge(selectFirstPreismeldung$).merge(selectNoPreismeldung$.map(() => null))
            .publishReplay(1).refCount();

        this.subscriptions.push(
            this.currentPreismeldung$
                .combineLatest(this.filteredPreismeldungen$, (bag, filteredPreismeldungen) => ({ bag, filteredPreismeldungen }))
                .withLatestFrom(this.ionItemHeight$, (x, ionItemHeight: number) => ({ bag: x.bag, filteredPreismeldungen: x.filteredPreismeldungen, ionItemHeight }))
                .delay(100)
                .subscribe(x => {
                    if (!x.bag) return;
                    const index = x.filteredPreismeldungen.findIndex(y => y.pmId === x.bag.pmId);
                    if (index < 0)
                        return;
                    var d = this.virtualScroll.calculateDimensions();
                    if ((index + 1) * x.ionItemHeight > this.virtualScroll.element.nativeElement.scrollTop + d.viewHeight) {
                        this.virtualScroll.element.nativeElement.scrollTop = ((index + 1) * x.ionItemHeight) - d.viewHeight;
                        this.virtualScroll.refresh();
                    }
                    if (index * x.ionItemHeight < this.virtualScroll.element.nativeElement.scrollTop) {
                        this.virtualScroll.element.nativeElement.scrollTop = index * x.ionItemHeight;
                        this.virtualScroll.refresh();
                    }
                })
        );

        this.completedCount$ = this.preismeldungen$
            .map(x => `${x.filter(y => y.preismeldung.istAbgebucht).length}/${x.length}`);
    }

    formatPercentageChange = (preismeldung: P.Models.Preismeldung) => {
        return preismeldung.d_DPToVPK != null && !isNaN(preismeldung.d_DPToVPK.percentage)
            ? formatPercentageChange(preismeldung.d_DPToVPK.percentage, 1)
            : formatPercentageChange(preismeldung.d_DPToVP.percentage, 1);
    }

    getBearbeitungscodeDescription(bearbeitungscode: P.Models.Bearbeitungscode) {
        return P.Models.bearbeitungscodeDescriptions[bearbeitungscode];
    }

    dateRegex = /(\d+)\.(\d+)\.(\d+)/;
    parseDate(s: string) {
        const parsed = this.dateRegex.exec(s);
        if (!parsed) return null;
        return new Date(+parsed[3], +parsed[2] - 1, +parsed[1] - 1);
    }

    calcStichtagStatus(bag: P.PreismeldungBag, currentTime: Date) {
        if (!bag.refPreismeldung) return null;
        const erhebungsAnfangsDatum = this.parseDate(bag.refPreismeldung.erhebungsAnfangsDatum);
        const erhebungsEndDatum = this.parseDate(bag.refPreismeldung.erhebungsEndDatum);
        if (isBefore(currentTime, erhebungsAnfangsDatum)) return 'gray';
        if (isAfter(currentTime, erhebungsAnfangsDatum) && isBefore(currentTime, subMilliseconds(erhebungsEndDatum, 1))) return 'green';
        if (isAfter(currentTime, erhebungsEndDatum) && isBefore(currentTime, subMilliseconds(addDays(erhebungsEndDatum, 1), 1))) return 'orange';
        if (isAfter(currentTime, subMilliseconds(addDays(erhebungsEndDatum, 1), 1))) return 'red';
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
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}
