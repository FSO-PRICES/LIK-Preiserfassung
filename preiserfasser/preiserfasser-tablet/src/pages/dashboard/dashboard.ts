import { Store } from '@ngrx/store';
import { Component, EventEmitter } from '@angular/core';
import { LoadingController, NavController, ModalController } from 'ionic-angular';
import { LoginModal } from '../login/login';
import { Observable } from 'rxjs';

import { format } from 'date-fns';
import * as deLocale from 'date-fns/locale/de';
// import * as frLocale from 'date-fns/locale/fr';

import * as fromRoot from '../../reducers';
import * as P from '../../common-models';
import { PmsDetailsPage } from '../pms-details/pms-details';
import { PmsPriceEntryPage } from '../pms-price-entry';
// import { TestPage } from '../test-page/test-page';

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
        private loadingCtrl: LoadingController,
        private modalCtrl: ModalController,
        private store: Store<fromRoot.AppState>
    ) {
        this.settingsClicked.subscribe(() => this.store.dispatch({ type: 'DELETE_DATABASE' }));

        const loader = this.loadingCtrl.create({
            content: 'Datensynchronisierung. Bitte warten...'
        });

        const loginModal = this.modalCtrl.create(LoginModal, null, { enableBackdropDismiss: false });

        const databaseExists$ = this.store.map(x => x.database)
            .filter(x => x.databaseExists !== null)
            .map(x => x.databaseExists)
            .distinctUntilChanged()
            .publishReplay(1).refCount();

        databaseExists$
            .filter(x => x)
            .subscribe(() => {
                this.store.dispatch({ type: 'PREISMELDESTELLEN_LOAD_ALL' });
                loader.dismiss();
            });

        databaseExists$
            .filter(x => !x)
            .flatMap(() => {
                loginModal.present();
                return Observable.bindCallback(cb => loginModal.onWillDismiss(cb))()
                    .map(([data, role]) => ({ data, role }));
            })
            .subscribe(x => {
                loader.present();
                this.store.dispatch({ type: 'DATABASE_SYNC', payload: x.data });
            });
    }

    navigateToDetails(pms: P.Models.Preismeldestelle) {
        this.navCtrl.push(PmsDetailsPage, { pmsNummer: pms.pmsNummer });
    }

    navigateToPriceEntry(pms: P.Models.Preismeldestelle) {
        this.navCtrl.push(PmsPriceEntryPage, { pmsNummer: pms.pmsNummer });
    }
}
