import { Component, OnInit, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { ProductsService } from '../../services/products-service';

// import * as pouchdb from 'pouchdb';

import * as P from '../../preiserfasser-types';

const SHOW_FILTER = 'Filter einblenden';
const HIDE_FILTER = 'Filter ausblenden';

@Component({
    selector: 'price-entry',
    templateUrl: 'price-entry.html'
})
export class PriceEntryPage implements OnInit {
    public products: Observable<P.AppState[]>;
    public viewPortItems: string[];
    public toggleFilter = new EventEmitter<void>();
    public showFilter: Observable<boolean>;
    public filterButtonText: Observable<string>;
    public selectProduct = new EventEmitter<P.Product>();
    public selectedProduct: Observable<P.Product>;

    form: FormGroup;

    constructor(formBuilder: FormBuilder, store: Store<P.AppState>, productsService: ProductsService) {
        this.form = formBuilder.group({
            filterText: ['']
        });

        this.showFilter = Observable.of(false);

        this.showFilter = this.toggleFilter
            .scan((showFilter, _) => !showFilter, false)
            .startWith(false);
        this.filterButtonText = this.showFilter
            .map(x => x ? HIDE_FILTER : SHOW_FILTER);

        const products$ = productsService.loadProducts().delay(1000);
        this.products = products$.combineLatest(this.form.valueChanges.startWith({ filterText: '' }), (products, filter) => {
            if (!filter.filterText) return products;
            const regExp = new RegExp(filter.filterText, 'i');
            return products.filter(x => x.name.de.search(regExp) !== -1);
        });

        this.selectedProduct = this.selectProduct;
    }

    ngOnInit() {
        // const db = new pouchdb('my_database');
        // db.put({
        //     _id: 'dave@gmail.com',
        //     name: 'David',
        //     age: 69
        // });
    }
}
