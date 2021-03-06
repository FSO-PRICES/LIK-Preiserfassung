/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

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
import { SyncState } from '../../reducers/database';

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
    private hasLoadedDataOnce = false;
    public filteredPreismeldestellen$: Observable<DashboardPms[]> = this.preismeldestellen$.pipe(
        combineLatest(this.filterTextValueChanges.pipe(startWith('')), (preismeldestellen, filterText) =>
            sortBySelector(
                pefSearch(filterText, preismeldestellen, [pms => pms.name, pms => pms.pmsNummer]),
                pms => `${pms.pmsTop ? 'A' : 'Z'}_${pms.name.toLowerCase()}`,
            ),
        ),
        publishReplay(1),
        refCount(),
    );

    public viewPortItems: P.Preismeldestelle[];

    private subscriptions: Subscription[];

    public syncState = SyncState;
    public isSyncing$ = this.store
        .select(x => x.database.isDatabaseSyncing)
        .pipe(
            publishReplay(1),
            refCount(),
        );
    public syncError$ = this.store.select(x => x.database.syncError);
    public loginError$ = this.store.select(x => x.login.loginError);
    public preismeldungenStatistics$ = this.store.select(fromRoot.getPreismeldungenStatistics).pipe(
        publishReplay(1),
        refCount(),
    );
    public erhebungsmonat$ = this.store.select(fromRoot.getErhebungsmonat).pipe(
        publishReplay(1),
        refCount(),
    );
    public lastSyncedAt$ = this.store.select(x => x.database.lastSyncedAt);
    public createdPmsPdf$ = this.store.select(fromRoot.getCreatedPmsPdf).pipe(
        publishReplay(1),
        refCount(),
    );
    public hasOpenSavedPreismeldungen$: Observable<boolean>;
    public canConnectToDatabase$: Observable<boolean>;
    public isCompatibleToDatabase$: Observable<boolean>;
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
            x.preismeldestellen.map(preismeldestelle => {
                const statistics =
                    !x.statistics || !x.statistics[preismeldestelle.pmsNummer]
                        ? ({} as any)
                        : x.statistics[preismeldestelle.pmsNummer];
                return {
                    preismeldestelle,
                    statistics,
                    isCompleted: statistics.uploadedCount >= statistics.totalCount,
                };
            }),
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
        const settings$ = this.store.select(fromRoot.getSettings).pipe(
            publishReplay(1),
            refCount(),
        );

        const databaseHasBeenUploaded$ = this.store.select(x => x.database.lastUploadedAt).pipe(distinctUntilChanged());

        const databaseExists$ = this.store
            .select(x => x.database.databaseExists)
            .pipe(
                distinctUntilChanged(),
                filter(exists => exists !== null),
                publishReplay(1),
                refCount(),
            );

        const loggedInUser$ = this.store.select(fromRoot.getLoggedInUser).pipe(
            publishReplay(1),
            refCount(),
        );
        this.isCompatibleToDatabase$ = this.store
            .select(x => x.database.isCompatibleToDatabase)
            .pipe(
                map(x => !(x === false)),
                publishReplay(1),
                refCount(),
            );
        const canConnectToDatabase$ = this.store
            .select(x => x.database.canConnectToDatabase)
            .pipe(
                combineLatest(this.isCompatibleToDatabase$, (connectable, compatible) => connectable && compatible),
                publishReplay(1),
                refCount(),
            );
        const isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn).pipe(
            combineLatest(canConnectToDatabase$, (isLoggedIn, canConnect) => ({ isLoggedIn, canConnect })),
            publishReplay(1),
            refCount(),
        );

        const loginDialogDismissed$ = this.loginClicked$.pipe(
            flatMap(() =>
                pefDialogService.displayModal(LoginModalComponent, {
                    dialogOptions: { backdropDismiss: false, cssClass: 'login-modal' },
                }),
            ),
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
            publishReplay(1),
            refCount(),
        );

        const dismissSyncLoading$ = this.isSyncing$.pipe(
            skip(1),
            filter(x => x !== SyncState.syncing),
            publishReplay(1),
            refCount(),
        );
        const dismissLoginLoading$ = this.isSyncing$.pipe(
            skip(1),
            filter(x => x !== SyncState.syncing),
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

        this.canConnectToDatabase$ = canConnectToDatabase$.pipe(
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
                                        { requestDismiss$: dismissSyncLoading$ },
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
                            .displayLoading(translateService.instant('text_synchronizing-data'), {
                                requestDismiss$: dismissSyncLoading$,
                            })
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
                            .displayLoading(translateService.instant('text_synchronizing-data'), {
                                requestDismiss$: dismissLoginLoading$,
                            })
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
                    filter(
                        isSyncing =>
                            isSyncing === SyncState.ready || (isSyncing === SyncState.error && !this.hasLoadedDataOnce),
                    ),
                    merge(canConnectToDatabase$.pipe(filter(canConnect => !canConnect && !this.hasLoadedDataOnce))),
                )
                .subscribe(() => {
                    this.hasLoadedDataOnce = true;
                    this.store.dispatch({ type: 'LOAD_PREISERHEBER' });
                    this.store.dispatch({ type: 'PREISMELDESTELLEN_LOAD_ALL' });
                    this.store.dispatch({ type: 'LOAD_WARENKORB' });
                    this.store.dispatch({ type: 'PREISMELDUNG_STATISTICS_LOAD' } as StatisticsAction);
                }),

            canConnectToDatabase$
                .pipe(
                    skip(1),
                    withLatestFrom(this.isSyncing$, (canConnect, isSyncing) => ({ canConnect, isSyncing })),
                    filter(({ canConnect, isSyncing }) => canConnect && isSyncing === SyncState.none),
                )
                .subscribe(() => this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' } as LoginAction)),

            this.createPmsPdf$
                .pipe(
                    withLatestFrom(this.erhebungsmonat$),
                    flatMap(data =>
                        pefDialogService
                            .displayLoading(translateService.instant('dialogText_pdf-preparing-data'), {
                                requestDismiss$: this.createdPmsPdf$.pipe(
                                    skip(1),
                                    filter(x => !!x),
                                ),
                            })
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
                    filter(x => !!x && (!!x.message || x.error.error)),
                    flatMap(({ message: location, error }) =>
                        this.pefMessageDialogService
                            .displayDialogOneButton(
                                'btn_ok',
                                error
                                    ? error.messageKey
                                        ? error.messageKey
                                        : 'dialogText_pdf-create-error'
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

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'RESET_MARKED_PREISMELDUNGEN' });
        this.store.dispatch({ type: 'RESET_WARENKORB_VIEW' });
    }

    public ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    trackByPms(
        index: number,
        item: {
            preismeldestelle: DashboardPms;
        },
    ) {
        if (item) return index;
        return item.preismeldestelle.pmsNummer;
    }

    toDashboardPms(pms: P.Preismeldestelle) {
        const _erhebungsart = parseErhebungsarten(pms.erhebungsart);
        return assign({}, pms, {
            keinErhebungsart: !pms.erhebungsart || (!!pms.erhebungsart && pms.erhebungsart === '000000'),
            isPdf: _erhebungsart.papierlisteVorOrt || _erhebungsart.papierlisteAbgegeben,
        });
    }
}
