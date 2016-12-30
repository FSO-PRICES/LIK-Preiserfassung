import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';

import { ReactiveComponent } from '../../../common/ReactiveComponent';

import * as P from '../../../common-models';

const SHOW_FILTER = 'Filter einblenden';
const HIDE_FILTER = 'Filter ausblenden';

@Component({
    selector: 'product-list',
    templateUrl: 'product-list.html'
})
export class ProductListComponent extends ReactiveComponent implements OnChanges {
    @Input() isDesktop: boolean;
    @Input() products: P.Product[];
    @Output() selectedProduct: Observable<P.Product>;

    public viewPortItems: P.Product[];
    public form: FormGroup;
    // public toggleFilter = new EventEmitter<void>();
    // public showFilter: Observable<boolean>;
    // public filterButtonText: Observable<string>;
    public selectProduct = new EventEmitter<P.Product>();
    public filteredProducts$: Observable<P.Product[]>;

    constructor(formBuilder: FormBuilder) {
        super();

        this.filteredProducts$ = this.observePropertyCurrentValue<P.Product[]>('products');

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

        this.selectedProduct = this.selectProduct;
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
        // console.log('changes', changes)
    }
}
