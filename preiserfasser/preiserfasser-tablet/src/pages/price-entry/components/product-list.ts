import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';

import { ReactiveComponent } from '../../../common/ReactiveComponent';

import * as P from '../../../preiserfasser-types';

const SHOW_FILTER = 'Filter einblenden';
const HIDE_FILTER = 'Filter ausblenden';

@Component({
    selector: 'product-list',
    templateUrl: 'product-list.html'
})
export class ProductListComponent extends ReactiveComponent implements OnChanges {
    @Input() products: P.Product[];
    @Output() selectedProduct: Observable<P.Product>;

    public viewPortItems: P.Product[];
    public form: FormGroup;
    public toggleFilter = new EventEmitter<void>();
    public showFilter: Observable<boolean>;
    public filterButtonText: Observable<string>;
    public selectProduct = new EventEmitter<P.Product>();
    public filteredProducts: Observable<P.Product[]>;

    constructor(formBuilder: FormBuilder) {
        super();

        this.form = formBuilder.group({
            filterText: ['']
        });

        this.showFilter = this.toggleFilter
            .scan((showFilter, _) => !showFilter, false)
            .startWith(false);
        this.filterButtonText = this.showFilter
            .map(x => x ? HIDE_FILTER : SHOW_FILTER);

        const products$ = this.observePropertyCurrentValue<P.Product[]>('products');
            // .do(x => alert('aaa'));

        this.filteredProducts = products$.combineLatest(this.form.valueChanges.startWith({ filterText: '' }), (products, filter) => {
            // alert('here');
            if (!filter.filterText) return products;
            const regExp = new RegExp(filter.filterText, 'i');
            // alert(`product count is ${products.length}`);
            return products.filter(x => x.name['de'].search(regExp) !== -1);
        });

        this.selectedProduct = this.selectProduct;
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    // ngOnChanges(changes: { [key: string]: SimpleChange }) {
    //     const key = Object.keys(changes)[0];
    //     if (key === 'products') {
    //         const products = changes['products'].currentValue;
    //         // alert(`got products ${!products ? null : products.length}`);
    //         this.products$.next(changes['products'].currentValue);
    //     }
    //     // this.changesObserver.next(changes);
    // }
}
