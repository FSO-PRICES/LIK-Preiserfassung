import { Store } from '@ngrx/store';
import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { LoadingController, NavController, ModalController, Modal, Loading } from 'ionic-angular';
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

import { pefSearch, PefDialogService } from 'lik-shared';

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
    private loader: Loading;

    constructor(
        private navCtrl: NavController,
        private pefDialogService: PefDialogService,
        private loadingCtrl: LoadingController,
        private modalCtrl: ModalController,
        private store: Store<fromRoot.AppState>
    ) {
        this.settingsClicked.subscribe(() => this.navigateToSettings());

        const settings$ = this.store.select(fromRoot.getSettings);

        const databaseExists$ = this.store.map(x => x.database)
            .map(x => x.databaseExists)
            .distinctUntilChanged()
            .filter(exists => exists !== null)
            .publishReplay(1).refCount();

        const loginDialogDismiss$ = databaseExists$
            .withLatestFrom(settings$, (databaseExists, settings) => databaseExists || settings.isDefault) // Do not try to login if settings are not set yet
            .filter(x => !x)
            .flatMap(() => pefDialogService.displayModal(LoginModal))
            .filter(x => x.data !== null)
            .publishReplay(1).refCount();

        // databaseExists$
        //     .filter(x => x)
        //     .subscribe(() => {
        //         this.store.dispatch({ type: 'PREISMELDESTELLEN_LOAD_ALL' });
        //         this.store.dispatch({ type: 'LOAD_WARENKORB' });
        //         loader.dismiss();
        //     });

        this.subscriptions = [
            loginDialogDismiss$ // In case of login data entered
                .filter(x => x.data.username !== null)
                .withLatestFrom(settings$, (x, settings) => assign({}, x.data, { url: settings.serverConnection.url }))
                .subscribe(payload => {
                    this.presentLoadingScreen().then(() => this.store.dispatch({ type: 'DATABASE_SYNC', payload }));
                }),

            loginDialogDismiss$ // In case of navigate to was set
                .filter(x => !!x.data.navigateTo)
                .subscribe(x => this.navCtrl.setRoot(x.data.navigateTo)),

            store.select(fromRoot.getPreismeldestellen)
                .filter(x => x != null)
                .merge(databaseExists$.filter(exists => !exists))
                .subscribe(() => this.dismissLoadingScreen())
        ];
    }

    public ngOnDestroy() {
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }

    private presentLoadingScreen() {
        return this.dismissLoadingScreen().then(() => {
            this.loader = this.loadingCtrl.create({
                content: 'Datensynchronisierung. Bitte warten...'
            });

            return this.loader.present().catch(error => {
                if (error !== false) throw (error);
            });
        });
    }

    private dismissLoadingScreen() {
        if (!!this.loader) {
            return this.loader.dismiss().catch(error => {
                if (error !== false) throw (error);
            });
        }
        return Promise.resolve(true);
    }

    navigateToDetails(pms: P.Models.Preismeldestelle) {
        this.navCtrl.push(PmsDetailsPage, { pmsNummer: pms.pmsNummer });
    }

    navigateToPriceEntry(pms: P.Models.Preismeldestelle) {
        this.navCtrl.push(PmsPriceEntryPage, { pmsNummer: pms.pmsNummer });
    }

    navigateToSettings() {
        this.navCtrl.setRoot(SettingsPage).catch(() => {});
    }
}
