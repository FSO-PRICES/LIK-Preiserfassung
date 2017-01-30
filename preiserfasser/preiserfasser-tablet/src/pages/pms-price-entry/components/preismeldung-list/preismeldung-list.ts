import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';

import { ReactiveComponent } from '../../../../common/ReactiveComponent';
import { formatPercentageChange } from '../../../../common/formatting-functions';

import * as P from '../../../../common-models';

// const SHOW_FILTER = 'Filter einblenden';
// const HIDE_FILTER = 'Filter ausblenden';

@Component({
    selector: 'preismeldung-list',
    templateUrl: 'preismeldung-list.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldungListComponent extends ReactiveComponent implements OnChanges {
    @Input() isDesktop: boolean;
    @Input() preismeldungen: P.Preismeldung[];
    @Input() currentPreismeldung = new EventEmitter<P.CurrentPreismeldung>();
    @Output() selectPreismeldung = new EventEmitter<P.Preismeldung>();

    public currentPreismeldung$: Observable<P.Preismeldung>;

    public viewPortItems: P.Preismeldung[];
    public form: FormGroup;
    // public toggleFilter = new EventEmitter<void>();
    // public showFilter: Observable<boolean>;
    // public filterButtonText: Observable<string>;
    // public selectPreismeldung = new EventEmitter<P.Preismeldung>();
    public filteredPreismeldungen$: Observable<P.Preismeldung[]>;

    constructor(formBuilder: FormBuilder) {
        super();

        this.filteredPreismeldungen$ = this.observePropertyCurrentValue<P.Preismeldung[]>('preismeldungen');
        this.currentPreismeldung$ = this.observePropertyCurrentValue<P.Preismeldung>('currentPreismeldung');

        this.form = formBuilder.group({
            filterText: ['']
        });

        // this.showFilter = this.toggleFilter
        //     .scan((showFilter, _) => !showFilter, false)
        //     .startWith(false);
        // this.filterButtonText = this.showFilter
        //     .map(x => x ? HIDE_FILTER : SHOW_FILTER);

        // const products$ = this.observePropertyCurrentValue<P.Product[]>('products');

        // this.filteredProducts = products$.combineLatest(this.form.valueChanges.startWith({ filterText: '' }), (products, filter) => {
        //     if (!filter.filterText) return products;
        //     const regExp = new RegExp(filter.filterText, 'i');
        //     return products.filter(x => x.name['de'].search(regExp) !== -1);
        // });

        // this.selectedPreismeldung = this.selectPreismeldung;
    }

    formatPercentageChange = percentageChange => formatPercentageChange(percentageChange, 0);

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        console.log('preismeldung-list ngOnChanges', changes);
        this.baseNgOnChanges(changes);
    }
}
