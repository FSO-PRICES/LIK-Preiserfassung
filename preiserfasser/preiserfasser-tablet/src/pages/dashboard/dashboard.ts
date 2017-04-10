import { Store } from '@ngrx/store';
import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { NavController } from 'ionic-angular';
import { TranslateService } from 'ng2-translate';
import { Subscription } from 'rxjs';
import { assign } from 'lodash';

import { format } from 'date-fns';
import * as deLocale from 'date-fns/locale/de';
// import * as frLocale from 'date-fns/locale/fr';

import { LoginModal } from '../login/login';
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

    constructor(
        private navCtrl: NavController,
        private pefDialogService: PefDialogService,
        private translateService: TranslateService,
        private store: Store<fromRoot.AppState>
    ) {
        this.settingsClicked.subscribe(() => this.navigateToSettings());

        const settings$ = this.store.select(fromRoot.getSettings);

        const loadingText$ = translateService.get('text_synchronizing-data');

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

        const dismissLoading$ = store.select(fromRoot.getPreismeldestellen)
            .filter(x => x != null && x.length !== 0)
            .merge(databaseExists$
                .skip(1) // Skip the first value because it is republished, we wait for a new one
                .filter(exists => exists === false)
            );

        this.subscriptions = [
            loginDialogDismiss$ // In case of login data entered
                .filter(x => x.data.username !== null)
                .withLatestFrom(settings$, loadingText$, (x, settings, loadingText) =>
                    ({ loadingText, payload: assign({}, x.data, { url: settings.serverConnection.url }) })
                )
                .flatMap(({ loadingText, payload }) => pefDialogService.displayLoading(loadingText, dismissLoading$).map(() => payload))
                .subscribe(payload => this.store.dispatch({ type: 'DATABASE_SYNC', payload })),

            loginDialogDismiss$ // In case of navigate to was set
                .filter(x => !!x.data.navigateTo)
                .subscribe(x => this.navCtrl.setRoot(x.data.navigateTo))
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
        this.navCtrl.setRoot(SettingsPage).catch(() => {});
    }
}
