import { Store } from '@ngrx/store';
import { Component, Inject } from '@angular/core';
import { NavParams, NavController } from 'ionic-angular';
import { Observable } from 'rxjs';

import * as fromRoot from '../../reducers';

@Component({
    selector: 'price-entry',
    templateUrl: 'price-entry.html'
})
export class PriceEntryPage {
    isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    products$ = this.store.select(fromRoot.getProducts);

    constructor(private navCtrl: NavController, private navParams: NavParams, private store: Store<fromRoot.AppState>) {
        this.store.dispatch({ type: 'PRODUCTS_LOAD_FOR_PMS', payload: navParams.get('pmsKey') });
        console.log('navParams', navParams)
    }

    navigate(id: string) {
        this.store.dispatch({ type: 'SELECT_PRODUCT', payload: id })
    }
}
