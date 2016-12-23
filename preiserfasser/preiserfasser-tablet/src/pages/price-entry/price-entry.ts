import { Component, EventEmitter } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { Store } from '@ngrx/store';

import * as P from '../../common-models';

import * as fromRoot from '../../reducers';

@Component({
    selector: 'price-entry',
    templateUrl: 'price-entry.html'
})
export class PriceEntryPage {
    isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    products$ = this.store.select(fromRoot.getProducts);
    selectedProduct = new EventEmitter<P.Product>();

    constructor(private navParams: NavParams, private store: Store<fromRoot.AppState>) {
    }

    ionViewDidLoad() {
        this.store.dispatch({ type: 'PRODUCTS_LOAD_FOR_PMS', payload: this.navParams.get('pmsKey') });
    }

    navigate(id: string) {
        this.store.dispatch({ type: 'SELECT_PRODUCT', payload: id })
    }

    ionViewDidLeave() {
        this.store.dispatch({ type: 'PRODUCTS_CLEAR' });
    }
}
