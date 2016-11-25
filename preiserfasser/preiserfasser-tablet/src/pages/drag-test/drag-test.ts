import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { PriceEntryPage } from '../price-entry/price-entry';

@Component({
    selector: 'drag-test',
    templateUrl: 'drag-test.html'
})
export class DragTestPage {
    constructor(public navCtrl: NavController) {
    }
}
