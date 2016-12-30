import { Store } from '@ngrx/store';
import { Component, EventEmitter } from '@angular/core';
import { NavController } from 'ionic-angular';

import * as fromRoot from '../../reducers';
import { Preismeldestelle } from '../../common-models';
import { PmsDetailsPage } from '../pms-details/pms-details';
import { PriceEntryPage } from '../price-entry/price-entry';
import { TestPage } from '../test-page/test-page';

@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.html'
})
export class DashboardPage {
    settingsClicked = new EventEmitter();
    productCount = 0;

    isDesktop$ = this.store.select(fromRoot.getIsDesktop);

    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);

    constructor(private navCtrl: NavController, private store: Store<fromRoot.AppState>) {
        this.settingsClicked.subscribe(() => this.store.dispatch({ type: 'DATABASE_SYNC' }));
    }

    navigateToDetails(preismeldestelle: Preismeldestelle) {
        // this.navCtrl.push(PmsDetailsPage, { pmsKey: preismeldestelle.pmsKey });
        this.navCtrl.push(TestPage);
    }

    navigateToPriceEntry(preismeldestelle: Preismeldestelle) {
        this.navCtrl.push(PriceEntryPage, { pmsKey: preismeldestelle.pmsKey });
    }
}
