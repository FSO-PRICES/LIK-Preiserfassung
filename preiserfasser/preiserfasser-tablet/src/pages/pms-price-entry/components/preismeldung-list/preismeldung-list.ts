import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';

import { ReactiveComponent } from '../../../../common/ReactiveComponent';
import { formatPercentageChange } from '../../../../common/formatting-functions';

import * as P from '../../../../common-models';

@Component({
    selector: 'preismeldung-list',
    templateUrl: 'preismeldung-list.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldungListComponent extends ReactiveComponent implements OnChanges {
    @Input() isDesktop: boolean;
    @Input() preismeldungen: P.Preismeldung[];
    @Input() currentPreismeldung: P.CurrentPreismeldungViewModel;
    @Output() selectPreismeldung: Observable<P.Preismeldung>;

    public currentPreismeldung$: Observable<P.PreismeldungViewModel>;
    public selectClickedPreismeldung$ = new EventEmitter<P.PreismeldungViewModel>();
    public selectNextPreismeldung$ = new EventEmitter();
    public selectPrevPreismeldung$ = new EventEmitter();

    public viewPortItems: P.Preismeldung[];
    // public toggleFilter = new EventEmitter<void>();
    // public showFilter: Observable<boolean>;
    // public filterButtonText: Observable<string>;
    // public selectPreismeldung = new EventEmitter<P.Preismeldung>();
    private preismeldungen$: Observable<P.PreismeldungViewModel[]>;
    public filteredPreismeldungen$: Observable<P.PreismeldungViewModel[]>;
    public completedCount$: Observable<string>;

    public filterText$ = new EventEmitter<string>();

    constructor() {
        super();

        this.preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungViewModel[]>('preismeldungen').publishReplay(1).refCount();
        this.currentPreismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungViewModel>('currentPreismeldung').publishReplay(1).refCount();

        this.filteredPreismeldungen$ = this.preismeldungen$
            .combineLatest(this.filterText$.startWith(null), (preismeldungen: P.PreismeldungViewModel[], filterText: string) => {
                if (!filterText || filterText.length === 0) return preismeldungen;

                const lowered = filterText.toLocaleLowerCase();
                return preismeldungen.filter(pm => pm.warenkorbPosition.gliederungspositionsnummer.toLocaleLowerCase().includes(lowered) || pm.warenkorbPosition.bezeichnung.de.toLocaleLowerCase().includes(lowered));
            });

        const selectNext$ = this.selectNextPreismeldung$
            .withLatestFrom(this.currentPreismeldung$, this.filteredPreismeldungen$, (_, currentPreismeldung: P.PreismeldungViewModel, filteredPreismeldungen: P.PreismeldungViewModel[]) => {
                if (!currentPreismeldung) return filteredPreismeldungen[0];
                const currentPreismeldungIndex = filteredPreismeldungen.findIndex(x => x.pmId === currentPreismeldung.pmId);
                if (currentPreismeldungIndex === filteredPreismeldungen.length - 1) return filteredPreismeldungen[0];
                return filteredPreismeldungen[currentPreismeldungIndex + 1];
            });

        const selectPrev$ = this.selectPrevPreismeldung$
            .withLatestFrom(this.currentPreismeldung$, this.filteredPreismeldungen$, (_, currentPreismeldung: P.PreismeldungViewModel, filteredPreismeldungen: P.PreismeldungViewModel[]) => {
                if (!currentPreismeldung) return filteredPreismeldungen[filteredPreismeldungen.length - 1];
                const currentPreismeldungIndex = filteredPreismeldungen.findIndex(x => x.pmId === currentPreismeldung.pmId);
                if (currentPreismeldungIndex === 0) return filteredPreismeldungen[filteredPreismeldungen.length - 1];
                return filteredPreismeldungen[currentPreismeldungIndex - 1];
            });

        this.selectPreismeldung = this.selectClickedPreismeldung$.merge(selectNext$).merge(selectPrev$);

        this.completedCount$ = this.preismeldungen$
            .map(x => `${x.filter(y => y.preismeldung.istAbgebucht).length}/${x.length}`);
    }

    formatPercentageChange = percentageChange => formatPercentageChange(percentageChange, 0);

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
