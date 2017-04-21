import { Store } from '@ngrx/store';
import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { NavController } from 'ionic-angular';
import { TranslateService } from 'ng2-translate';
import { Subscription, Observable } from 'rxjs';
import { assign } from 'lodash';

import { format } from 'date-fns';
import * as deLocale from 'date-fns/locale/de';
// import * as frLocale from 'date-fns/locale/fr';

import { pefSearch, PefDialogService, Models as P } from 'lik-shared';

import { LoginModal } from '../login/login';
import * as fromRoot from '../../reducers';
import { PmsDetailsPage } from '../pms-details/pms-details';
import { PmsPriceEntryPage } from '../pms-price-entry';
import { SettingsPage } from '../settings/settings';

import { Action as StatisticsAction } from '../../actions/statistics';
import { Actions as DatabaseAction } from '../../actions/database';
import { PreismeldungenStatistics } from '../../reducers/statistics';

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
    public uploadPreismeldungenClicked$ = new EventEmitter();

    public filteredPreismeldestellen$ = this.preismeldestellen$
        .combineLatest(this.filterTextValueChanges.startWith(''), (preismeldestellen, filterText) =>
            pefSearch(filterText, preismeldestellen, [pms => pms.name])
        );
    public viewPortItems: P.Preismeldestelle[];

    private subscriptions: Subscription[];

    public erhebungsmonat$: Observable<Date>;
    public preismeldungenStatistics$: Observable<PreismeldungenStatistics>;
    public canConnectToDatabase$: Observable<boolean>;

    constructor(
        private navCtrl: NavController,
        private pefDialogService: PefDialogService,
        private translateService: TranslateService,
        private store: Store<fromRoot.AppState>
    ) {
        this.settingsClicked.subscribe(() => this.navigateToSettings());

        const settings$ = this.store.select(fromRoot.getSettings);

        const loadingText$ = translateService.get('text_synchronizing-data');

        const databaseHasBeenUploaded$ = this.store.select(x => x.database)
            .map(database => database.lastUploadedAt)
            .distinct();

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

        this.erhebungsmonat$ = Observable.of(new Date()); // TODO: This should not be the current date
        this.preismeldungenStatistics$ = this.store.select(fromRoot.getPreismeldungenStatistics).filter(x => !!x);
        this.canConnectToDatabase$ = this.store.map(x => x.database.canConnectToDatabase)
            .filter(x => x !== null)
            .startWith(false)
            .publishReplay(1).refCount();

        this.subscriptions = [
            databaseExists$
                .filter(exists => exists)
                .combineLatest(databaseHasBeenUploaded$)
                // Re-/Load Statistics only when database exists and every time the database has been uploaded
                .subscribe(() => this.store.dispatch({ type: 'PREISMELDUNG_STATISTICS_LOAD' } as StatisticsAction)),

            loginDialogDismiss$ // In case of login data entered
                .filter(x => x.data.username !== null)
                .withLatestFrom(settings$, loadingText$, (x, settings, loadingText) =>
                    ({ loadingText, payload: assign({}, x.data, { url: settings.serverConnection.url }) })
                )
                .flatMap(({ loadingText, payload }) => pefDialogService.displayLoading(loadingText, dismissLoading$).map(() => payload))
                .subscribe(payload => this.store.dispatch({ type: 'DOWNLOAD_DATABASE', payload })),

            loginDialogDismiss$ // In case of navigate to was set
                .filter(x => !!x.data.navigateTo)
                .subscribe(x => this.navCtrl.setRoot(x.data.navigateTo, {}, { animate: true, direction: 'forward' })),

            this.uploadPreismeldungenClicked$
                .flatMap(() => pefDialogService.displayModal(LoginModal))
                .withLatestFrom(settings$, loadingText$, (x, settings, loadingText) =>
                    ({ loadingText, payload: assign({}, x.data, { url: settings.serverConnection.url }) })
                )
                .flatMap(({ loadingText, payload }) => pefDialogService.displayLoading(loadingText, databaseHasBeenUploaded$.skip(1)).map(() => payload))
                .subscribe(payload => this.store.dispatch({ type: 'UPLOAD_DATABASE', payload })),

            Observable.interval(3000).subscribe(() => this.store.dispatch({ type: 'CHECK_CONNECTIVITY_TO_DATABASE' } as DatabaseAction))
        ];
    }

    public ngOnDestroy() {
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }

    navigateToDetails(pms: P.Preismeldestelle) {
        this.navCtrl.setRoot(PmsDetailsPage, { pmsNummer: pms.pmsNummer }, { animate: true, direction: 'forward' });
    }

    navigateToPriceEntry(pms: P.Preismeldestelle) {
        this.navCtrl.setRoot(PmsPriceEntryPage, { pmsNummer: pms.pmsNummer }, { animate: true, direction: 'forward' });
    }

    navigateToSettings() {
        this.navCtrl.setRoot(SettingsPage, {}, { animate: true, direction: 'forward' }).catch(() => { });
    }

    getPreismeldestelleStatistics(pmsNummer: number, field: string) {
        return this.preismeldungenStatistics$.map(statistics => !!statistics[pmsNummer] ? statistics[pmsNummer][field] || 0 : 0);
    }

    isPreismeldestelleCompleted(pmsNummer) {
        return this.getPreismeldestelleStatistics(pmsNummer, 'totalCount')
            .withLatestFrom(this.getPreismeldestelleStatistics(pmsNummer, 'uploadedCount'), (totalCount, uploadedCount) => uploadedCount >= totalCount);
    }

    hasOpenSavedPreismeldungen() {
        return this.preismeldungenStatistics$.map(statistics => !!statistics.total ? statistics.total.openSavedCount > 0 : false).startWith(false);
    }
}
