import { Component, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { ProductsService } from '../../services/products-service';

import * as P from '../../preiserfasser-types';

@Component({
    selector: 'price-entry',
    templateUrl: 'price-entry.html'
})
export class PriceEntryPage {
    public products: Observable<P.Product[]>;
    public selectedProduct = new EventEmitter<P.Product>();

    constructor(store: Store<P.AppState>, productsService: ProductsService) {
        this.products = Observable.of(null).delay(1000)
            .flatMap(() => productsService.loadProducts(), (_, products: P.Product[]) => products);

        this.selectedProduct
            .subscribe(x => console.log('product selected:', x));
    }
}
