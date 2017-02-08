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
    private preismeldungen$: Observable<P.PreismeldungViewModel[]>;
    public filteredPreismeldungen$: Observable<P.PreismeldungViewModel[]>;
    public completedCount$: Observable<string>;

    public filterText$ = new EventEmitter<string>();

    public selectFilterTodo$ = new EventEmitter();
    public selectFilterCompleted$ = new EventEmitter();

    public filterTodoSelected$: Observable<boolean>;
    public filterCompletedSelected$: Observable<boolean>;

    constructor() {
        super();

        this.preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungViewModel[]>('preismeldungen').publishReplay(1).refCount();
        this.currentPreismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungViewModel>('currentPreismeldung').publishReplay(1).refCount();

        this.filterTodoSelected$ = this.selectFilterTodo$
            .scan<boolean>((selected: boolean, _: any) => !selected, false).startWith(false)
            .publishReplay(1).refCount();

        this.filterCompletedSelected$ = this.selectFilterCompleted$
            .scan<boolean>((selected: boolean, _: any) => !selected, false).startWith(false)
            .publishReplay(1).refCount();

        this.filteredPreismeldungen$ = this.preismeldungen$
            .combineLatest(this.filterText$.startWith(null), this.filterTodoSelected$, this.filterCompletedSelected$, (preismeldungen: P.PreismeldungViewModel[], filterText: string, filterTodoSelected: boolean, filterCompletedSelected: boolean) => {
                let filteredPreismeldungen: P.PreismeldungViewModel[];

                if (!filterText || filterText.length === 0) {
                    filteredPreismeldungen = preismeldungen;
                } else {
                    const lowered = filterText.toLocaleLowerCase();
                    filteredPreismeldungen = preismeldungen.filter(pm => pm.warenkorbPosition.gliederungspositionsnummer.toLocaleLowerCase().includes(lowered) || pm.warenkorbPosition.bezeichnung.de.toLocaleLowerCase().includes(lowered));
                }

                if (filterTodoSelected && filterCompletedSelected || !filterTodoSelected && !filterCompletedSelected) return filteredPreismeldungen;

                if (filterTodoSelected) return filteredPreismeldungen.filter(p => !p.preismeldung.istAbgebucht);
                if (filterCompletedSelected) return filteredPreismeldungen.filter(p => p.preismeldung.istAbgebucht);
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
