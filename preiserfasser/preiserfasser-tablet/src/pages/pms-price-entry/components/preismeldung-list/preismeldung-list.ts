import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { Observable, ConnectableObservable } from 'rxjs';
import { isEqual } from 'lodash';

import { ReactiveComponent, formatPercentageChange, pefSearch } from 'lik-shared';

import * as P from '../../../../common-models';

@Component({
    selector: 'preismeldung-list',
    templateUrl: 'preismeldung-list.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldungListComponent extends ReactiveComponent implements OnChanges {
    @Input() isDesktop: boolean;
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Input() currentLanguage: string;
    @Input() preismeldungen: P.Models.Preismeldung[];
    @Input() currentPreismeldung: P.CurrentPreismeldungBag;
    @Output() selectPreismeldung: Observable<P.Models.Preismeldung>;
    @Output('addNewPreisreihe') addNewPreisreihe$ = new EventEmitter();

    public currentPreismeldung$: Observable<P.PreismeldungBag>;
    public currentLanguage$: Observable<string>;
    public selectClickedPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    public selectNextPreismeldung$ = new EventEmitter();
    public selectPrevPreismeldung$ = new EventEmitter();

    public viewPortItems: P.Models.Preismeldung[];
    private preismeldungen$: Observable<P.PreismeldungBag[]>;
    public filteredPreismeldungen$: Observable<P.PreismeldungBag[]>;
    public completedCount$: Observable<string>;

    public filterText$ = new EventEmitter<string>();

    public selectFilterTodo$ = new EventEmitter();
    public selectFilterCompleted$ = new EventEmitter();

    public filterTodoSelected$: ConnectableObservable<boolean>;
    public filterCompletedSelected$: ConnectableObservable<boolean>;

    public preismeldestelle$: Observable<P.Models.Preismeldestelle> = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle');

    constructor(ngZone: NgZone) {
        super();

        this.preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen').publishReplay(1).refCount();
        // this.preismeldungen$.subscribe(x => console.log('asdfasdfasdf', x))
        this.currentPreismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('currentPreismeldung').publishReplay(1).refCount();
        this.currentLanguage$ = this.observePropertyCurrentValue<string>('currentLanguage').publishReplay(1).refCount();

        const localFilterTodoSelected$ = new EventEmitter<boolean>();
        const localFilterCompletedSelected$ = new EventEmitter<boolean>();

        this.filterTodoSelected$ = localFilterTodoSelected$.publishReplay(1);
        this.filterTodoSelected$.connect();

        this.filterCompletedSelected$ = localFilterCompletedSelected$.publishReplay(1);
        this.filterCompletedSelected$.connect();

        this.selectFilterTodo$
            .withLatestFrom(this.filterCompletedSelected$, (todo, selected) => ({ todo, selected }))
            .scan<boolean>((selected: boolean, _: any) => !selected, true).startWith(true)
            .distinct()
            // .observeOnZone(ngZone)
            .subscribe(x => localFilterTodoSelected$.emit(x));

        this.selectFilterCompleted$
            .scan<boolean>((selected: boolean, _: any) => !selected, true).startWith(true)
            .distinct()
            // .observeOnZone(ngZone)
            .subscribe(x => localFilterCompletedSelected$.emit(x));

        const filterOptions$ = this.filterText$.startWith('')
            .combineLatest(this.filterTodoSelected$, this.filterCompletedSelected$, (filterText, filterTodoSelected: boolean, filterCompletedSelected: boolean) => ({ filterText, filterTodoSelected, filterCompletedSelected }))
            .distinctUntilChanged((x, y) => true)
            // .do(x => console.log('before distinct'))
            // .distinctUntilChanged((x, y) => {
            //     console.log('distinct', x, y, isEqual(x, y))
            //     // return isEqual(x, y);
            //     return true;
            //  })
            // .do(x => console.log('after distinct'))

        const inputData$ = this.preismeldungen$.combineLatest(this.currentLanguage$, (preismeldungen, currentLanguage) => ({ preismeldungen, currentLanguage }));
        // inputData$.subscribe(x => console.log('zzzzz', x))

        this.filteredPreismeldungen$ = filterOptions$.do(x => console.log('from filterOptions$'))
            .combineLatest(inputData$.do(x => console.log('from inputData$')), (filterOptions, inputData: { preismeldungen: P.PreismeldungBag[], currentLanguage: string }) => {
                console.log('here', filterOptions, inputData)
                let filteredPreismeldungen: P.PreismeldungBag[];

                if (!filterOptions.filterText || filterOptions.filterText.length === 0) {
                    filteredPreismeldungen = inputData.preismeldungen;
                } else {
                    filteredPreismeldungen = pefSearch(filterOptions.filterText, inputData.preismeldungen, [pm => pm.warenkorbPosition.gliederungspositionsnummer, pm => pm.warenkorbPosition.positionsbezeichnung[inputData.currentLanguage], pm => pm.preismeldung.artikeltext]);
                }

                // console.log({ filterTodoSelected, filterCompletedSelected });
                // console.log(preismeldungen)

                if (filterOptions.filterTodoSelected && filterOptions.filterCompletedSelected) return filteredPreismeldungen;

                if (!filterOptions.filterTodoSelected) return filteredPreismeldungen.filter(p => !p.preismeldung.istAbgebucht);
                if (!filterOptions.filterCompletedSelected) return filteredPreismeldungen.filter(p => p.preismeldung.istAbgebucht);
            });

        // this.filteredPreismeldungen$ = this.preismeldungen$
        //     .combineLatest(this.filterText$.startWith(null), this.filterTodoSelected$.startWith(true), this.filterCompletedSelected$.startWith(true), this.currentLanguage$, (preismeldungen: P.PreismeldungBag[], filterText: string, filterTodoSelected: boolean, filterCompletedSelected: boolean, currentLanguage: string) => Observable.of({ preismeldungen, filterText, filterTodoSelected, filterCompletedSelected, currentLanguage }))
        //     // .throttleTime(100)
        //     .debounceTime(1000)
        //     .switchMap<{ preismeldungen: P.PreismeldungBag[], filterText: string, filterTodoSelected: boolean, filterCompletedSelected: boolean, currentLanguage: string }>(x => x)
        //     .map(x => {
        //         console.log('here')
        //         let filteredPreismeldungen: P.PreismeldungBag[];

        //         if (!x.filterText || x.filterText.length === 0) {
        //             filteredPreismeldungen = x.preismeldungen;
        //         } else {
        //             filteredPreismeldungen = pefSearch(x.filterText, x.preismeldungen, [pm => pm.warenkorbPosition.gliederungspositionsnummer, pm => pm.warenkorbPosition.positionsbezeichnung[x.currentLanguage], pm => pm.preismeldung.artikeltext]);
        //         }

        //         // console.log({ filterTodoSelected, filterCompletedSelected });

        //         if (x.filterTodoSelected && x.filterCompletedSelected) return filteredPreismeldungen;

        //         if (!x.filterTodoSelected) return filteredPreismeldungen.filter(p => !p.preismeldung.istAbgebucht);
        //         if (!x.filterCompletedSelected) return filteredPreismeldungen.filter(p => p.preismeldung.istAbgebucht);
        //     }).debounceTime(100);

        const selectNext$ = this.selectNextPreismeldung$
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

        this.selectPreismeldung = this.selectClickedPreismeldung$.merge(selectNext$).merge(selectPrev$);

        this.completedCount$ = this.preismeldungen$
            .map(x => `${x.filter(y => y.preismeldung.istAbgebucht).length}/${x.length}`);

    }

    formatPercentageChange = (preismeldung: P.Models.Preismeldung) => {
        return preismeldung.percentageDPToVPNeuerArtikel != null && !isNaN(preismeldung.percentageDPToVPNeuerArtikel)
            ? formatPercentageChange(preismeldung.percentageDPToVPNeuerArtikel, 0)
            : formatPercentageChange(preismeldung.percentageDPToLVP, 0);
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
