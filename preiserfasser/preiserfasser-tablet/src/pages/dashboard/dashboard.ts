import { Component, EventEmitter } from '@angular/core';
import { NavController } from 'ionic-angular';
// import { PriceEntryPage } from '../price-entry/price-entry';
// import { DragTestPage } from '../drag-test/drag-test';

import { syncData, getProductCount } from './sync-data';

@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.html'
})
export class DashboardPage {
    settingsClicked = new EventEmitter();
    productCount = 0;

    constructor(public navCtrl: NavController) {
        // this.settingsClicked
        //     .subscribe(() => {
        //         alert('hoi2');
        //     });
        this.settingsClicked
            .subscribe(() => {
                syncData()
                    .then(() => getProductCount())
                    .then(x => this.productCount = x);
            });

        getProductCount()
            .then(x => this.productCount = x);
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
