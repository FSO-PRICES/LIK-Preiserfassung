import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import assign from 'lodash/assign';
import { interval, Observable, Subscription } from 'rxjs';
import {
    combineLatest,
    debounceTime,
    delay,
    distinctUntilChanged,
    filter,
    flatMap,
    map,
    merge,
    publishReplay,
    refCount,
    skip,
    startWith,
    take,
    withLatestFrom,
} from 'rxjs/operators';

import {
    Models as P,
    parseErhebungsarten,
    PefDialogService,
    PefMessageDialogService,
    pefSearch,
    PreismeldungAction,
    sortBySelector,
} from '@lik-shared';

import * as fromRoot from '../../reducers';

import { Actions as DatabaseAction } from '../../actions/database';
import { Action as LoginAction } from '../../actions/login';
import { Action as PdfAction } from '../../actions/pdf';
import { Action as StatisticsAction } from '../../actions/statistics';
import { LoginModalComponent } from '../../components/login-modal';
import { PreismeldestelleStatistics } from '../../reducers/statistics';

type DashboardPms = P.Preismeldestelle & {
    keinErhebungsart: boolean;
    isPdf: boolean;
};

@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.page.html',
    styleUrls: ['./dashboard.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnDestroy {
    public isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    private preismeldestellen$ = this.store
        .select(fromRoot.getPreismeldestellen)
        .pipe(map(preismeldestellen => preismeldestellen.map(this.toDashboardPms)));
    public currentTime$ = this.store.select(fromRoot.getCurrentTime);

    public filterTextValueChanges = new EventEmitter<string>();
    public uploadPreismeldungenClicked$ = new EventEmitter();
    public synchronizeClicked$ = new EventEmitter();
    public loginClicked$ = new EventEmitter();

    public showLogin$: Observable<boolean>;
    public canSync$: Observable<boolean>;
    public filteredPreismeldestellen$: Observable<DashboardPms[]> = this.preismeldestellen$.pipe(
        combineLatest(this.filterTextValueChanges.pipe(startWith('')), (preismeldestellen, filterText) =>
            sortBySelector(
                pefSearch(filterText, preismeldestellen, [pms => pms.name]),
                pms => `${pms.pmsTop ? 'A' : 'Z'}_${pms.name.toLowerCase()}`,
            ),
        ),
        publishReplay(1),
        refCount(),
    );

    public viewPortItems: P.Preismeldestelle[];

    private subscriptions: Subscription[];

    public isSyncing$ = this.store.select(x => x.database.isDatabaseSyncing);
    public syncError$ = this.store.select(x => x.database.syncError);
    public loginError$ = this.store.select(x => x.login.loginError);
    public preismeldungenStatistics$ = this.store.select(fromRoot.getPreismeldungenStatistics);
    public erhebungsmonat$ = this.store.select(fromRoot.getErhebungsmonat);
    public lastSyncedAt$ = this.store.select(x => x.database.lastSyncedAt);
    public createdPmsPdf$ = this.store.select(fromRoot.getCreatedPmsPdf).pipe(
        publishReplay(1),
        refCount(),
    );
    public hasOpenSavedPreismeldungen$: Observable<boolean>;
    public canConnectToDatabase$: Observable<boolean>;
    public navigateToPriceEntry$ = new EventEmitter<P.Preismeldestelle>();
    public navigateToPreiserheber$ = new EventEmitter();
    public navigateToSettings$ = new EventEmitter();
    public navigateToDetails$ = new EventEmitter<P.Preismeldestelle>();
    public createPmsPdf$ = new EventEmitter<P.Preismeldestelle>();
    public finishedPrinting$ = new EventEmitter();

    public filteredPreismeldestellenWithStatistics$ = this.filteredPreismeldestellen$.pipe(
        combineLatest(this.preismeldungenStatistics$, (preismeldestellen, statistics) => ({
            preismeldestellen,
            statistics,
        })),
        map(x =>
            x.preismeldestellen.map(preismeldestelle => ({
                preismeldestelle,
                statistics: !x.statistics ? {} : x.statistics[preismeldestelle.pmsNummer],
            })),
        ),
        debounceTime(300),
        startWith([]),
    );

    constructor(
        private navCtrl: NavController,
        pefDialogService: PefDialogService,
        private pefMessageDialogService: PefMessageDialogService,
        translateService: TranslateService,
        private store: Store<fromRoot.AppState>,
    ) {
        const settings$ = this.store.select(fromRoot.getSettings);

        const databaseHasBeenUploaded$ = this.store.select(x => x.database.lastUploadedAt).pipe(distinctUntilChanged());

        const databaseExists$ = this.store
            .select(x => x.database.databaseExists)
            .pipe(
                distinctUntilChanged(),
                filter(exists => exists !== null),
                publishReplay(1),
                refCount(),
            );

        const loggedInUser$ = this.store.select(fromRoot.getLoggedInUser);
        const canConnectToDatabase$ = this.store.select(x => x.database.canConnectToDatabase);
        const isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn).pipe(
            skip(1),
            combineLatest(canConnectToDatabase$, (isLoggedIn, canConnect) => ({ isLoggedIn, canConnect })),
        );

        const loginDialogDismissed$ = this.loginClicked$.pipe(
            flatMap(() => pefDialogService.displayModal(LoginModalComponent)),
            publishReplay(1),
            refCount(),
        );

        this.showLogin$ = isLoggedIn$.pipe(
            filter(({ isLoggedIn, canConnect }) => isLoggedIn !== null && canConnect !== null),
            map(({ isLoggedIn, canConnect }) => !isLoggedIn && !!canConnect),
            startWith(false),
        );
        this.canSync$ = isLoggedIn$.pipe(
            filter(({ isLoggedIn, canConnect }) => isLoggedIn !== null && canConnect !== null),
            map(({ isLoggedIn, canConnect }) => !!isLoggedIn && !!canConnect),
            startWith(false),
        );

        const dismissSyncLoading$ = this.isSyncing$.pipe(
            skip(1),
            filter(x => x === false),
        );
        const dismissLoginLoading$ = this.isSyncing$.pipe(
            skip(1),
            filter(x => x === false),
            merge(
                this.store.select(fromRoot.getIsLoggedIn).pipe(
                    skip(1),
                    filter(x => x !== null),
                ),
            ),
        );

        this.hasOpenSavedPreismeldungen$ = this.preismeldungenStatistics$.pipe(
            filter(x => !!x),
            map(statistics => (!!statistics.total ? statistics.total.openSavedCount > 0 : false)),
            startWith(false),
        );

        this.canConnectToDatabase$ = this.store
            .select(x => x.database.canConnectToDatabase)
            .pipe(
                filter(x => x !== null),
                startWith(false),
                publishReplay(1),
                refCount(),
            );

        this.subscriptions = [
            databaseExists$
                .pipe(
                    filter(exists => exists),
                    combineLatest(databaseHasBeenUploaded$),
                )
                // Re-/Load Statistics only when database exists and every time the database has been uploaded
                .subscribe(() => {
                    this.store.dispatch({ type: 'PREISMELDUNG_STATISTICS_LOAD' } as StatisticsAction);
                    this.store.dispatch({ type: 'LOAD_DATABASE_LAST_SYNCED_AT' } as DatabaseAction);
                }),

            this.canSync$
                .pipe(
                    filter(canSync => canSync),
                    take(1), // Only sync the database once each time the dashboard is being visited
                    merge(
                        this.synchronizeClicked$
                            .asObservable()
                            .pipe(
                                flatMap(() =>
                                    pefDialogService.displayLoading(
                                        translateService.instant('text_synchronizing-data'),
                                        dismissSyncLoading$,
                                    ),
                                ),
                            ),
                    ),
                    withLatestFrom(settings$, loggedInUser$, (_, settings, user) =>
                        assign({}, { url: settings.serverConnection.url, username: user.username }),
                    ),
                )
                .subscribe(payload => this.store.dispatch({ type: 'SYNC_DATABASE', payload } as DatabaseAction)),

            this.uploadPreismeldungenClicked$
                .pipe(
                    withLatestFrom(settings$, loggedInUser$, (x, settings, user) =>
                        assign({}, { url: settings.serverConnection.url, username: user.username }),
                    ),
                    flatMap(payload =>
                        pefDialogService
                            .displayLoading(translateService.instant('text_synchronizing-data'), dismissSyncLoading$)
                            .pipe(map(() => payload)),
                    ),
                )
                .subscribe(payload => this.store.dispatch({ type: 'UPLOAD_DATABASE', payload } as DatabaseAction)),

            loginDialogDismissed$ // In case of login data entered
                .pipe(
                    filter(x => x.data.username !== null),
                    withLatestFrom(settings$, (x, settings) =>
                        assign({}, x.data, { url: settings.serverConnection.url }),
                    ),
                    flatMap(payload =>
                        pefDialogService
                            .displayLoading(translateService.instant('text_synchronizing-data'), dismissLoginLoading$)
                            .pipe(map(() => payload)),
                    ),
                )
                .subscribe(payload => this.store.dispatch({ type: 'LOGIN', payload } as LoginAction)),

            loginDialogDismissed$ // In case of navigate to was set
                .pipe(filter(x => !!x.data.navigateTo))
                .subscribe(x => this.navCtrl.navigateRoot(x.data.navigateTo, {})),

            this.navigateToPriceEntry$
                .pipe(delay(100))
                .subscribe(pms => this.navCtrl.navigateRoot(['pms-price-entry', pms.pmsNummer])),

            this.navigateToPreiserheber$.pipe(delay(100)).subscribe(() => this.navCtrl.navigateRoot(['pe-details'])),

            this.navigateToSettings$.pipe(delay(100)).subscribe(() => this.navCtrl.navigateRoot(['settings'])),

            this.navigateToDetails$
                .pipe(delay(100))
                .subscribe(pms => this.navCtrl.navigateRoot(['pms-details', pms.pmsNummer])),

            interval(10000)
                .pipe(startWith(0))
                .subscribe(() => this.store.dispatch({ type: 'CHECK_CONNECTIVITY_TO_DATABASE' } as DatabaseAction)),

            this.isSyncing$
                .pipe(
                    skip(1),
                    filter(isSyncing => !isSyncing),
                )
                .subscribe(() => {
                    this.store.dispatch({ type: 'LOAD_PREISERHEBER' });
                    this.store.dispatch({ type: 'PREISMELDESTELLEN_LOAD_ALL' });
                    this.store.dispatch({ type: 'LOAD_WARENKORB' });
                    this.store.dispatch({ type: 'PREISMELDUNG_STATISTICS_LOAD' } as StatisticsAction);
                }),

            canConnectToDatabase$
                .pipe(
                    skip(1),
                    withLatestFrom(this.isSyncing$, (canConnect, isSyncing) => ({ canConnect, isSyncing })),
                    filter(({ canConnect, isSyncing }) => canConnect && !isSyncing),
                )
                .subscribe(() => this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' } as LoginAction)),

            this.createPmsPdf$
                .pipe(
                    withLatestFrom(this.erhebungsmonat$),
                    flatMap(data =>
                        pefDialogService
                            .displayLoading(
                                translateService.instant('dialogText_pdf-preparing-data'),
                                this.createdPmsPdf$.pipe(
                                    skip(1),
                                    filter(x => !!x),
                                ),
                            )
                            .pipe(map(() => data)),
                    ),
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

            this.createdPmsPdf$
                .pipe(
                    skip(1),
                    filter(x => !!x && (!!x.message || x.error)),
                    flatMap(({ message: location, error }) =>
                        this.pefMessageDialogService
                            .displayDialogOneButton(
                                'btn_ok',
                                error
                                    ? 'dialogText_pdf-create-error'
                                    : location === 'DOCUMENT_LOCATION'
                                    ? 'dialogText_pdf-saved-at-documents'
                                    : 'dialogText_pdf-saved-at-application',
                            )
                            .pipe(
                                map(res => {
                                    switch (res.data) {
                                        case 'CLOSE':
                                            return location;
                                    }
                                }),
                            ),
                    ),
                )
                .subscribe(),
        ];
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
