import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';

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
    @Output() selectPreismeldung: Observable<P.PreismeldungBag>;
    @Output('addNewPreisreihe') addNewPreisreihe$ = new EventEmitter();

    public selectClickedPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    public selectNextPreismeldung$ = new EventEmitter();
    public selectPrevPreismeldung$ = new EventEmitter();

    public viewPortItems: P.Models.Preismeldung[];
    public filteredPreismeldungen$: Observable<P.PreismeldungBag[]>;
    public completedCount$: Observable<string>;

    public filterText$ = new EventEmitter<string>();

    public selectFilterTodo$ = new EventEmitter();
    public selectFilterCompleted$ = new EventEmitter();

    public filterTodoSelected$: Observable<boolean>;
    public filterCompletedSelected$: Observable<boolean>;

    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle');
    public currentLanguage$ = this.observePropertyCurrentValue<string>('currentLanguage');
    public currentPreismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('currentPreismeldung');
    private preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen');

    constructor() {
        super();

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
            .publishReplay(1).refCount();

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
            ? formatPercentageChange(preismeldung.percentageDPToVPNeuerArtikel, 1)
            : formatPercentageChange(preismeldung.percentageDPToLVP, 1);
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
