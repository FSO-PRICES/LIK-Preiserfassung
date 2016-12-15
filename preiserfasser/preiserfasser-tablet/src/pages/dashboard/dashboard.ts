import { Store } from '@ngrx/store';
import { Component, EventEmitter } from '@angular/core';
import { NavController } from 'ionic-angular';

import * as fromRoot from '../../reducers';

// import { PriceEntryPage } from '../price-entry/price-entry';
// import { DragTestPage } from '../drag-test/drag-test';

// import { syncData, getProductCount } from './sync-data';

@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.html'
})
export class DashboardPage {
    settingsClicked = new EventEmitter();
    productCount = 0;

    isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    // isDesktop$ = this.store.select(x => x.appConfig.isDesktop).mapTo(true);
    // isDesktop$ = Observable.of(true);

    public preismeldestellen$ = this.store.select(x => x.preismeldestellen).map(x => x.entities);

    constructor(public navCtrl: NavController, private store: Store<fromRoot.AppState>) {
        // this.store.subscribe(x => console.log('store is', JSON.stringify(x)))
        this.store.dispatch({ type: 'PREISMELDESTELLEN_LOAD_ALL' });
        this.settingsClicked.subscribe(() => this.store.dispatch({ type: 'DATABASE_SYNC' }));

        // this.settingsClicked
        //     .subscribe(() => {
        //         alert('hoi2');
        //     });
        // this.settingsClicked
        //     .subscribe(() => {
        //         syncData()
        //             .then(() => getProductCount())
        //             .then(x => this.productCount = x);
        //     });

        // getProductCount()
        //     .then(x => this.productCount = x);
        //     // .flatMap(() => syncData())
            // .subscribe(() => console.log('settings clicked'));
    }

    // navigateToPriceEntry() {
    //     this.navCtrl.push(PriceEntryPage);
    // }

    // navigateToDragTest() {
    //     this.navCtrl.push(DragTestPage);
    // }

    // settingsClicked() {
    //     syncData()
    //         .then(() => alert('done'));
    // }
}
