import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { PriceEntryPage } from '../price-entry/price-entry';
import { DragTestPage } from '../drag-test/drag-test';

@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.html'
})
export class DashboardPage {
    constructor(public navCtrl: NavController) {
    }

    navigateToPriceEntry() {
        this.navCtrl.push(PriceEntryPage);
    }

    navigateToDragTest() {
        this.navCtrl.push(DragTestPage);
    }
}
