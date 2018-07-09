import { Store } from '@ngrx/store';
import { Component, EventEmitter, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { NavController, IonicPage } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable } from 'rxjs';
import assign from 'lodash/assign';

import {
    pefSearch,
    PefDialogService,
    PefMessageDialogService,
    Models as P,
    parseErhebungsarten,
    PreismeldungAction,
    sortBySelector,
} from 'lik-shared';

import * as fromRoot from '../../reducers';

import { Action as PdfAction } from '../../actions/pdf';
import { Action as StatisticsAction } from '../../actions/statistics';
import { Actions as DatabaseAction } from '../../actions/database';
import { Action as LoginAction } from '../../actions/login';
import { PreismeldestelleStatistics } from '../../reducers/statistics';

import * as IDBExportImport from 'indexeddb-export-import';
import * as bluebird from 'bluebird';

type DashboardPms = P.Preismeldestelle & {
    keinErhebungsart: boolean;
    isPdf: boolean;
};

@IonicPage()
@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnDestroy {
    public isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    private preismeldestellen$ = this.store
        .select(fromRoot.getPreismeldestellen)
        .map(preismeldestellen => preismeldestellen.map(this.toDashboardPms));
    public currentTime$ = this.store.select(fromRoot.getCurrentTime);

    public filterTextValueChanges = new EventEmitter<string>();
    public uploadPreismeldungenClicked$ = new EventEmitter();
    public synchronizeClicked$ = new EventEmitter();
    public loginClicked$ = new EventEmitter();

    public showLogin$: Observable<boolean>;
    public canSync$: Observable<boolean>;
    public filteredPreismeldestellen$: Observable<DashboardPms[]> = this.preismeldestellen$
        .combineLatest(this.filterTextValueChanges.startWith(''), (preismeldestellen, filterText) =>
            sortBySelector(
                pefSearch(filterText, preismeldestellen, [pms => pms.name]),
                pms => `${pms.pmsTop ? 'A' : 'Z'}_${pms.name.toLowerCase()}`
            )
        )
        // .do(x => console.log('am here', x))
        .publishReplay(1)
        .refCount();

    public viewPortItems: P.Preismeldestelle[];

    private subscriptions: Subscription[];

    public isSyncing$ = this.store.select(x => x.database.isDatabaseSyncing);
    public syncError$ = this.store.select(x => x.database.syncError);
    public loginError$ = this.store.select(x => x.login.loginError);
    public preismeldungenStatistics$ = this.store.select(fromRoot.getPreismeldungenStatistics);
    public erhebungsmonat$ = this.store.select(fromRoot.getErhebungsmonat);
    public lastSyncedAt$ = this.store.select(x => x.database.lastSyncedAt);
    public hasOpenSavedPreismeldungen$: Observable<boolean>;
    public canConnectToDatabase$: Observable<boolean>;
    public navigateToPriceEntry$ = new EventEmitter<P.Preismeldestelle>();
    public navigateToPreiserheber$ = new EventEmitter();
    public navigateToSettings$ = new EventEmitter();
    public navigateToDetails$ = new EventEmitter<P.Preismeldestelle>();
    public createPmsPdf$ = new EventEmitter<P.Preismeldestelle>();
    public finishedPrinting$ = new EventEmitter();

    public filteredPreismeldestellenWithStatistics$ = this.filteredPreismeldestellen$
        .combineLatest(this.preismeldungenStatistics$, (preismeldestellen, statistics) => ({
            preismeldestellen,
            statistics,
        }))
        .map(x =>
            x.preismeldestellen.map(preismeldestelle => ({
                preismeldestelle,
                statistics: !x.statistics ? {} : x.statistics[preismeldestelle.pmsNummer],
            }))
        )
        .debounceTime(300)
        .startWith([]);
    // .subscribe(x => console.log('XXX', x));

    constructor(
        private navCtrl: NavController,
        private pefDialogService: PefDialogService,
        private pefMessageDialogService: PefMessageDialogService,
        private translateService: TranslateService,
        private store: Store<fromRoot.AppState>
    ) {
        const settings$ = this.store.select(fromRoot.getSettings);

        const databaseHasBeenUploaded$ = this.store.select(x => x.database.lastUploadedAt).distinctUntilChanged();

        const databaseExists$ = this.store
            .select(x => x.database.databaseExists)
            .distinctUntilChanged()
            .filter(exists => exists !== null)
            .publishReplay(1)
            .refCount();

        const loggedInUser$ = this.store.select(fromRoot.getLoggedInUser);
        const canConnectToDatabase$ = this.store.select(x => x.database.canConnectToDatabase);
        const isLoggedIn$ = this.store
            .select(fromRoot.getIsLoggedIn)
            .skip(1)
            .combineLatest(canConnectToDatabase$, (isLoggedIn, canConnect) => ({ isLoggedIn, canConnect }));

        const loginDialogDismissed$ = this.loginClicked$
            .flatMap(() => pefDialogService.displayModal('LoginModal'))
            .publishReplay(1)
            .refCount();

        this.showLogin$ = isLoggedIn$
            .filter(({ isLoggedIn, canConnect }) => isLoggedIn !== null && canConnect !== null)
            .map(({ isLoggedIn, canConnect }) => !isLoggedIn && !!canConnect)
            .startWith(false);
        this.canSync$ = isLoggedIn$
            .filter(({ isLoggedIn, canConnect }) => isLoggedIn !== null && canConnect !== null)
            .map(({ isLoggedIn, canConnect }) => !!isLoggedIn && !!canConnect)
            .startWith(false);

        const dismissSyncLoading$ = this.isSyncing$.skip(1).filter(x => x === false);
        const dismissLoginLoading$ = this.isSyncing$
            .skip(1)
            .filter(x => x === false)
            .merge(
                this.store
                    .select(fromRoot.getIsLoggedIn)
                    .skip(1)
                    .filter(x => x !== null)
            );

        this.hasOpenSavedPreismeldungen$ = this.preismeldungenStatistics$
            .filter(x => !!x)
            .map(statistics => (!!statistics.total ? statistics.total.openSavedCount > 0 : false))
            .startWith(false);

        this.canConnectToDatabase$ = this.store
            .select(x => x.database.canConnectToDatabase)
            .filter(x => x !== null)
            .startWith(false)
            .publishReplay(1)
            .refCount();

        this.subscriptions = [
            databaseExists$
                .filter(exists => exists)
                .combineLatest(databaseHasBeenUploaded$)
                // Re-/Load Statistics only when database exists and every time the database has been uploaded
                .subscribe(() => {
                    this.store.dispatch({ type: 'PREISMELDUNG_STATISTICS_LOAD' } as StatisticsAction);
                    this.store.dispatch({ type: 'LOAD_DATABASE_LAST_SYNCED_AT' } as DatabaseAction);
                }),

            this.canSync$
                .filter(canSync => canSync)
                .take(1) // Only sync the database once each time the dashboard is being visited
                .merge(
                    this.synchronizeClicked$
                        .asObservable()
                        .flatMap(() =>
                            pefDialogService.displayLoading(
                                translateService.instant('text_synchronizing-data'),
                                dismissSyncLoading$
                            )
                        )
                )
                .withLatestFrom(settings$, loggedInUser$, (_, settings, user) =>
                    assign({}, { url: settings.serverConnection.url, username: user.username })
                )
                .subscribe(payload => this.store.dispatch({ type: 'SYNC_DATABASE', payload } as DatabaseAction)),

            this.uploadPreismeldungenClicked$
                .withLatestFrom(settings$, loggedInUser$, (x, settings, user) =>
                    assign({}, { url: settings.serverConnection.url, username: user.username })
                )
                .flatMap(payload =>
                    pefDialogService
                        .displayLoading(translateService.instant('text_synchronizing-data'), dismissSyncLoading$)
                        .map(() => payload)
                )
                .subscribe(payload => this.store.dispatch({ type: 'UPLOAD_DATABASE', payload } as DatabaseAction)),

            loginDialogDismissed$ // In case of login data entered
                .filter(x => x.data.username !== null)
                .withLatestFrom(settings$, (x, settings) => assign({}, x.data, { url: settings.serverConnection.url }))
                .flatMap(payload =>
                    pefDialogService
                        .displayLoading(translateService.instant('text_synchronizing-data'), dismissLoginLoading$)
                        .map(() => payload)
                )
                .subscribe(payload => this.store.dispatch({ type: 'LOGIN', payload } as LoginAction)),

            loginDialogDismissed$ // In case of navigate to was set
                .filter(x => !!x.data.navigateTo)
                .subscribe(x => this.navCtrl.setRoot(x.data.navigateTo, {})),

            this.navigateToPriceEntry$
                .delay(100)
                .subscribe(pms =>
                    this.navCtrl.setRoot('PmsPriceEntryPage', { pmsNummer: pms.pmsNummer, reload: true })
                ),

            this.navigateToPreiserheber$.delay(100).subscribe(() => this.navCtrl.setRoot('PreiserheberPage')),

            this.navigateToSettings$.delay(100).subscribe(() => this.navCtrl.setRoot('SettingsPage')),

            this.navigateToDetails$
                .delay(100)
                .subscribe(pms => this.navCtrl.setRoot('PmsDetailsPage', { pmsNummer: pms.pmsNummer })),

            Observable.interval(10000)
                .startWith(0)
                .subscribe(() => this.store.dispatch({ type: 'CHECK_CONNECTIVITY_TO_DATABASE' } as DatabaseAction)),

            this.isSyncing$
                .skip(1)
                .filter(isSyncing => !isSyncing)
                .subscribe(() => {
                    this.store.dispatch({ type: 'LOAD_PREISERHEBER' });
                    this.store.dispatch({ type: 'PREISMELDESTELLEN_LOAD_ALL' });
                    this.store.dispatch({ type: 'LOAD_WARENKORB' });
                    this.store.dispatch({ type: 'PREISMELDUNG_STATISTICS_LOAD' } as StatisticsAction);
                }),

            canConnectToDatabase$
                .skip(1)
                .withLatestFrom(this.isSyncing$, (canConnect, isSyncing) => ({ canConnect, isSyncing }))
                .filter(({ canConnect, isSyncing }) => canConnect && !isSyncing)
                .subscribe(() => this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' } as LoginAction)),

            this.createPmsPdf$
                .withLatestFrom(this.erhebungsmonat$)
                .flatMap(data =>
                    pefDialogService
                        .displayLoading(
                            translateService.instant('dialogText_pdf-preparing-data'),
                            this.store
                                .select(fromRoot.getCreatedPmsPdf)
                                .skip(1)
                                .filter(x => !!x)
                        )
                        .map(() => data)
                )
                .subscribe(([preismeldestelle, erhebungsmonat]) => {
                    this.store.dispatch({
                        type: 'CREATE_PMS_PDF',
                        payload: { preismeldestelle, erhebungsmonat },
                    } as PdfAction);
                    this.store.dispatch({
                        type: 'PREISMELDUNGEN_LOAD_FOR_PMS',
                        payload: preismeldestelle.pmsNummer,
                    } as PreismeldungAction);
                }),

            this.store
                .select(fromRoot.getCreatedPmsPdf)
                .skip(1)
                .filter(x => !!x && !!x.message)
                .flatMap(({ message: location }) =>
                    this.pefMessageDialogService
                        .displayDialogOneButton(
                            'btn_ok',
                            location == 'DOCUMENT_LOCATION'
                                ? 'dialogText_pdf-saved-at-documents'
                                : 'dialogText_pdf-saved-at-application'
                        )
                        .map(res => {
                            switch (res.data) {
                                case 'CLOSE':
                                    return location;
                            }
                        })
                )
                .subscribe(),
        ];

        this.dumpIndexedDbs();
    }

    public async dumpIndexedDbs() {
        const dbs = [
            '_pouch_lik',
            '_pouch_pouch__all_dbs__',
            '_pouch_preismeldungen',
            '_pouch_preismeldungen_status',
            '_pouch_settings',
        ];
        let exportedDbs = {};

        const lookups2 = bluebird.mapSeries(dbs, db => {
            return new bluebird.Promise((resolve, reject) => {
                console.log('Opening: ', db);
                const dbConnection = window.indexedDB.open(db, 5);
                dbConnection.onsuccess = function(event) {
                    const idb_db = dbConnection.result;
                    IDBExportImport.exportToJsonString(idb_db, function(err, jsonString) {
                        if (err) {
                            console.error(err);
                            reject(err);
                        } else {
                            console.log('Exported as JSON: ', db);
                            resolve({ [db]: btoa(decodeURIComponent(encodeURIComponent(jsonString))) });
                            // IDBExportImport.clearDatabase(idb_db, function (err) {
                            //     if (!err) // cleared data successfully
                            //         IDBExportImport.importFromJsonString(idb_db, jsonString, function (err) {
                            //             if (!err)
                            //                 console.log("Imported data successfully");
                            //         });
                            // });
                        }
                    });
                };
            });
        });

        console.log('Exported result:', JSON.stringify((await lookups2).reduce((acc, x) => ({ ...acc, ...x }), {})));
    }

    public ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    toDashboardPms(pms: P.Preismeldestelle) {
        const _erhebungsart = parseErhebungsarten(pms.erhebungsart);
        return assign({}, pms, {
            keinErhebungsart: !pms.erhebungsart || (!!pms.erhebungsart && pms.erhebungsart === '000000'),
            isPdf: _erhebungsart.papierlisteVorOrt || _erhebungsart.papierlisteAbgegeben,
        });
    }

    public isPreismeldestelleCompleted = (preismeldestelleStatistics: PreismeldestelleStatistics) =>
        preismeldestelleStatistics.uploadedCount >= preismeldestelleStatistics.totalCount;
}
