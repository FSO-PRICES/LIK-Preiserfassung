import { Component, EventEmitter } from '@angular/core';
import { NavController } from 'ionic-angular';
// import { PriceEntryPage } from '../price-entry/price-entry';
// import { DragTestPage } from '../drag-test/drag-test';

import { syncData } from './sync-data';

@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.html'
})
export class DashboardPage {
    settingsClicked = new EventEmitter();

    constructor(public navCtrl: NavController) {
        this.settingsClicked
            .subscribe(() => {
                alert('hoi2');
            });
        // this.settingsClicked
        //     .subscribe(() => {
        //         syncData()
        //             .then(() => alert('done'));
        //     });
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
