import { Store } from '@ngrx/store';
import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { LoadingController, NavController, ModalController } from 'ionic-angular';
import { LoginModal } from '../login/login';
import { Observable, Subscription } from 'rxjs';
import { assign } from 'lodash';

import { format } from 'date-fns';
import * as deLocale from 'date-fns/locale/de';
// import * as frLocale from 'date-fns/locale/fr';

import * as fromRoot from '../../reducers';
import * as P from '../../common-models';
import { PmsDetailsPage } from '../pms-details/pms-details';
import { PmsPriceEntryPage } from '../pms-price-entry';
import { SettingsPage } from '../settings/settings';

import { pefSearch } from 'lik-shared';

@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.html'
})
export class DashboardPage implements OnDestroy {
    public settingsClicked = new EventEmitter();
    public isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    private preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);
    public currentTime$ = this.store.select(fromRoot.getCurrentTime)
        .map(x => (format as any)(x, 'dddd, DD.MM.YYYY HH:mm', { locale: deLocale }));

    public filterTextValueChanges = new EventEmitter<string>();

    public filteredPreismeldestellen$ = this.preismeldestellen$
        .combineLatest(this.filterTextValueChanges.startWith(''),
            (preismeldestellen, filterText) => pefSearch(filterText, preismeldestellen, [pms => pms.name]));

    private subscriptions: Subscription[];

    constructor(
        private navCtrl: NavController,
        private loadingCtrl: LoadingController,
        private modalCtrl: ModalController,
        private store: Store<fromRoot.AppState>
    ) {
        this.settingsClicked.subscribe(() => this.navigateToSettings());

        const loader = this.loadingCtrl.create({
            content: 'Datensynchronisierung. Bitte warten...'
        });

        const loginModal = this.modalCtrl.create(LoginModal, null, { enableBackdropDismiss: false });

        const settings$ = this.store.select(fromRoot.getSettings);

        const databaseExists$ = this.store.map(x => x.database)
            .filter(x => x.databaseExists !== null)
            .map(x => x.databaseExists)
            .distinctUntilChanged()
            .publishReplay(1).refCount();

        // databaseExists$
        //     .filter(x => x)
        //     .subscribe(() => {
        //         this.store.dispatch({ type: 'PREISMELDESTELLEN_LOAD_ALL' });
        //         this.store.dispatch({ type: 'LOAD_WARENKORB' });
        //         loader.dismiss();
        //     });

        this.subscriptions = [
            databaseExists$
                .combineLatest(settings$, (databaseExists, settings) => databaseExists || settings.isDefault) // Do not try to login if settings are not set yet
                .filter(x => !x)
                .flatMap(() => {
                    loginModal.present();
                    return Observable.bindCallback(cb => loginModal.onWillDismiss(cb))()
                        .map(([data, role]) => ({ data, role }));
                })
                .withLatestFrom(settings$, (x, settings) => assign({}, x.data, { url: settings.serverConnection.url }))
                .subscribe(payload => {
                    loader.present().then(() => this.store.dispatch({ type: 'DATABASE_SYNC', payload }));
                }),

            store.select(fromRoot.getPreismeldestellen).filter(x => x != null).subscribe(() => loader.dismiss())
        ];
    }

    public ngOnDestroy() {
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }

    navigateToDetails(pms: P.Models.Preismeldestelle) {
        this.navCtrl.push(PmsDetailsPage, { pmsNummer: pms.pmsNummer });
    }

    navigateToPriceEntry(pms: P.Models.Preismeldestelle) {
        this.navCtrl.push(PmsPriceEntryPage, { pmsNummer: pms.pmsNummer });
    }

    navigateToSettings() {
        this.navCtrl.push(SettingsPage).catch(() => {});
    }
}
