import { Store } from '@ngrx/store';
import { Component, EventEmitter } from '@angular/core';
import { NavController } from 'ionic-angular';

import { format } from 'date-fns';
import * as deLocale from 'date-fns/locale/de';
import * as frLocale from 'date-fns/locale/fr';

import * as fromRoot from '../../reducers';
import { Preismeldestelle } from '../../common-models';
import { PmsDetailsPage } from '../pms-details/pms-details';
import { PmsPriceEntryPage } from '../pms-price-entry';
import { TestPage } from '../test-page/test-page';

@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.html'
})
export class DashboardPage {
    public settingsClicked = new EventEmitter();
    public isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    private preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);
    public currentTime$ = this.store.select(fromRoot.getCurrentTime)
        .map(x => (format as any)(x, 'dddd, DD.MM.YYYY HH:mm', { locale: deLocale }));

    public filterTextValueChanges = new EventEmitter<string>();

    public filteredPreismeldestellen$ = this.preismeldestellen$
        .combineLatest(this.filterTextValueChanges.startWith(null),
            (preismeldestellen, filterText) => preismeldestellen.filter(x => !filterText || x.name.includes(filterText)));

    constructor(
        private navCtrl: NavController,
        private store: Store<fromRoot.AppState>
    ) {
        this.settingsClicked.subscribe(() => this.store.dispatch({ type: 'DATABASE_SYNC' }));
    }

    navigateToDetails(preismeldestelle: Preismeldestelle) {
        this.navCtrl.push(PmsDetailsPage, { pmsKey: preismeldestelle.pmsKey });
    }

    navigateToPriceEntry(preismeldestelle: Preismeldestelle) {
        this.navCtrl.push(PmsPriceEntryPage, { pmsKey: preismeldestelle.pmsKey });
    }
}
