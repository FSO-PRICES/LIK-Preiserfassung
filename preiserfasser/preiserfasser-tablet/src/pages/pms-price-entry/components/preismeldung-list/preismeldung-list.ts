import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';

import { ReactiveComponent, formatPercentageChange } from 'lik-shared';

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

    public filterTodoSelected$: Observable<boolean>;
    public filterCompletedSelected$: Observable<boolean>;

    public preismeldestelle$: Observable<P.Models.Preismeldestelle> = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle');

    constructor() {
        super();

        this.preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen').publishReplay(1).refCount();
        this.currentPreismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('currentPreismeldung').publishReplay(1).refCount();
        this.currentLanguage$ = this.observePropertyCurrentValue<string>('currentLanguage').publishReplay(1).refCount();

        this.filterTodoSelected$ = this.selectFilterTodo$
            .scan<boolean>((selected: boolean, _: any) => !selected, false).startWith(false)
            .publishReplay(1).refCount();

        this.filterCompletedSelected$ = this.selectFilterCompleted$
            .scan<boolean>((selected: boolean, _: any) => !selected, false).startWith(false)
            .publishReplay(1).refCount();

        this.filteredPreismeldungen$ = this.preismeldungen$
            .combineLatest(this.filterText$.startWith(null), this.filterTodoSelected$, this.filterCompletedSelected$, this.currentLanguage$, (preismeldungen: P.PreismeldungBag[], filterText: string, filterTodoSelected: boolean, filterCompletedSelected: boolean, currentLanguage: string) => {
                let filteredPreismeldungen: P.PreismeldungBag[];

                if (!filterText || filterText.length === 0) {
                    filteredPreismeldungen = preismeldungen;
                } else {
                    const lowered = filterText.toLocaleLowerCase();
                    const tokens = lowered.split(' ').filter(x => !x.match(/^\s*$/));
                    filteredPreismeldungen = preismeldungen.filter(pm =>
                        tokens.reduce((agg, t) => agg && (pm.warenkorbPosition.gliederungspositionsnummer + ' ' + pm.warenkorbPosition.positionsbezeichnung[currentLanguage] + ' ' + pm.preismeldung.artikeltext).toLocaleLowerCase().includes(t) , true));
                }

                if (filterTodoSelected && filterCompletedSelected || !filterTodoSelected && !filterCompletedSelected) return filteredPreismeldungen;

                if (filterTodoSelected) return filteredPreismeldungen.filter(p => !p.preismeldung.istAbgebucht);
                if (filterCompletedSelected) return filteredPreismeldungen.filter(p => p.preismeldung.istAbgebucht);
            });

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
