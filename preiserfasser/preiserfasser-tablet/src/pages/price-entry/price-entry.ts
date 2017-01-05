import { Component, EventEmitter } from '@angular/core';
import { NavParams, NavController } from 'ionic-angular';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';

import * as P from '../../common-models';

import * as fromRoot from '../../reducers';

@Component({
    selector: 'price-entry',
    templateUrl: 'price-entry.html',
})
export class PriceEntryPage {
    isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    products$ = this.store.select(fromRoot.getProducts);
    selectProduct$ = new EventEmitter<P.Product>();
    selectTab$ = new EventEmitter<string>();
    toolbarButtonClicked$ = new EventEmitter<string>();

    selectedTab$ = this.selectTab$.publishReplay(1).refCount();
    selectedProduct$ = this.selectProduct$.publishReplay(1).refCount();

    constructor(
        private navController: NavController,
        private navParams: NavParams,
        private store: Store<fromRoot.AppState>
    ) {
        this.toolbarButtonClicked$
            .filter(x => x === 'HOME')
            .subscribe(() => this.navController.pop());

        this.selectedTab$
            .subscribe(x => console.log(x));
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
