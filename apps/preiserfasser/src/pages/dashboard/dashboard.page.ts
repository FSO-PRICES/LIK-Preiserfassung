import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import * as O from '@effect/data/Option';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
    Observable,
    combineLatest,
    debounceTime,
    distinctUntilChanged,
    filter,
    interval,
    map,
    merge,
    shareReplay,
    skip,
    startWith,
    switchMap,
    take,
    tap,
    withLatestFrom,
} from 'rxjs';

import {
    OE,
    OO,
    Models as P,
    PefDialogService,
    PefMessageDialogService,
    PreismeldungAction,
    parseErhebungsarten,
    pefSearch,
    sortBySelector,
} from '@lik-shared';

import { Actions as DatabaseAction } from '../../actions/database';
import { Action as LoginAction } from '../../actions/login';
import { Action as PdfAction } from '../../actions/pdf';
import { Action as StatisticsAction } from '../../actions/statistics';
import { LoginModalComponent } from '../../components/login-modal';
import * as fromRoot from '../../reducers';
import { SyncState } from '../../reducers/database';

type DashboardPms = P.Preismeldestelle & {
    keinErhebungsart: boolean;
    isPdf: boolean;
};

@UntilDestroy()
@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.page.html',
    styleUrls: ['./dashboard.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements AfterViewInit {
    public isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    private preismeldestellen$ = this.store
        .select(fromRoot.getPreismeldestellen)
        .pipe(map((preismeldestellen) => preismeldestellen.map(this.toDashboardPms)));
    public currentTime$ = this.store.select(fromRoot.getCurrentTime);

    public filterTextValueChanges = new EventEmitter<string>();
    public uploadPreismeldungenClicked$ = new EventEmitter();
    public synchronizeClicked$ = new EventEmitter();
    public loginClicked$ = new EventEmitter();

    public showLogin$: Observable<boolean>;
    public canSync$: Observable<boolean>;
    private hasLoadedDataOnce = false;
    public filteredPreismeldestellen$: Observable<DashboardPms[]> = combineLatest([
        this.preismeldestellen$,
        this.filterTextValueChanges.pipe(startWith('')),
    ]).pipe(
        map(([preismeldestellen, filterText]) =>
            sortBySelector(
                pefSearch(filterText, preismeldestellen, [(pms) => pms.name, (pms) => pms.pmsNummer]),
                (pms) => `${pms.pmsTop ? 'A' : 'Z'}_${pms.name.toLowerCase()}`,
            ),
        ),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    public viewPortItems: P.Preismeldestelle[];

    public syncState = SyncState;
    public isSyncing$ = this.store
        .select((x) => x.database.isDatabaseSyncing)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    public syncError$ = this.store.select((x) => x.database.syncError);
    public loginError$ = this.store.select((x) => x.login.loginError);
    public preismeldungenStatistics$ = this.store
        .select(fromRoot.getPreismeldungenStatistics)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    public erhebungsmonat$ = this.store
        .select(fromRoot.getErhebungsmonat)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    public lastSyncedAt$ = this.store.select((x) => x.database.lastSyncedAt);
    public createdPmsPdf$ = this.store
        .select(fromRoot.getCreatedPmsPdf)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    public hasOpenSavedPreismeldungen$: Observable<boolean>;
    public canConnectToDatabase$: Observable<boolean>;
    public isCompatibleToDatabase$: Observable<boolean>;
    public navigateToDetails$ = new EventEmitter<P.Preismeldestelle>();
    public createPmsPdf$ = new EventEmitter<P.Preismeldestelle>();
    public finishedPrinting$ = new EventEmitter();

    public filteredPreismeldestellenWithStatistics$ = combineLatest([
        this.filteredPreismeldestellen$,
        this.preismeldungenStatistics$,
    ]).pipe(
        map(([preismeldestellen, statistics]) =>
            preismeldestellen.map((preismeldestelle) => {
                const _statistics =
                    !statistics || !statistics[preismeldestelle.pmsNummer]
                        ? ({} as any)
                        : statistics[preismeldestelle.pmsNummer];
                return {
                    preismeldestelle,
                    statistics: _statistics,
                    isCompleted: _statistics.uploadedCount >= _statistics.totalCount,
                };
            }),
        ),
        debounceTime(300),
        startWith([]),
    );

    constructor(
        private router: Router,
        pefDialogService: PefDialogService,
        private pefMessageDialogService: PefMessageDialogService,
        translateService: TranslateService,
        private store: Store<fromRoot.AppState>,
    ) {
        const serverConnectionUrl$ = this.store.select(fromRoot.getSettings).pipe(
            map((a) => a.serverConnectionUrl),
            OE.fromFilteredRight,
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        const databaseHasBeenUploaded$ = this.store
            .select((x) => x.database.lastUploadedAt)
            .pipe(distinctUntilChanged());

        const databaseExists$ = this.store
            .select((x) => x.database.databaseExists)
            .pipe(
                distinctUntilChanged(),
                filter((exists) => exists !== null),
                shareReplay({ bufferSize: 1, refCount: true }),
            );

        const loggedInUser$ = this.store
            .select(fromRoot.getLoggedInUser)
            .pipe(shareReplay({ bufferSize: 1, refCount: true }));

        this.isCompatibleToDatabase$ = this.store
            .select((x) => x.database.isCompatibleToDatabase)
            .pipe(
                map((x) => !(x === false)),
                shareReplay({ bufferSize: 1, refCount: true }),
            );

        const canConnectToDatabase$ = combineLatest([
            this.store.select((x) => x.database.canConnectToDatabase),
            this.isCompatibleToDatabase$,
        ]).pipe(
            map(([connectable, compatible]) => connectable && compatible),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        const isLoggedIn$ = combineLatest([this.store.select(fromRoot.getIsLoggedIn), canConnectToDatabase$]).pipe(
            map(([isLoggedIn, canConnect]) => ({ isLoggedIn, canConnect })),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        const loginDialogDismissed$ = this.loginClicked$.pipe(
            switchMap(() => pefDialogService.displayDialog(LoginModalComponent, { disableClose: true })),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.showLogin$ = isLoggedIn$.pipe(
            map(({ isLoggedIn, canConnect }) => !isLoggedIn && !!canConnect),
            startWith(false),
        );

        this.canSync$ = isLoggedIn$.pipe(
            filter(({ isLoggedIn, canConnect }) => isLoggedIn !== null && canConnect !== null),
            map(({ isLoggedIn, canConnect }) => !!isLoggedIn && !!canConnect),
            startWith(false),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        const dismissSyncLoading$ = this.isSyncing$.pipe(
            skip(1),
            filter((x) => x !== SyncState.syncing),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        const dismissLoginLoading$ = merge(
            this.isSyncing$.pipe(
                skip(1),
                filter((x) => x !== SyncState.syncing),
            ),
            this.store.select(fromRoot.getIsLoggedIn).pipe(
                skip(1),
                filter((x) => x !== null),
            ),
        );

        this.hasOpenSavedPreismeldungen$ = this.preismeldungenStatistics$.pipe(
            filter((x) => !!x),
            map((statistics) => (statistics.total ? statistics.total.openSavedCount > 0 : false)),
            startWith(false),
        );

        this.canConnectToDatabase$ = canConnectToDatabase$.pipe(
            startWith(false),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        // Re-/Load Statistics only when database exists and every time the database has been uploaded
        combineLatest([databaseExists$.pipe(filter((exists) => exists)), databaseHasBeenUploaded$])
            .pipe(untilDestroyed(this))
            .subscribe(() => {
                this.store.dispatch({ type: 'PREISMELDUNG_STATISTICS_LOAD' } as StatisticsAction);
                this.store.dispatch({ type: 'LOAD_DATABASE_LAST_SYNCED_AT' } as DatabaseAction);
            });

        merge(
            this.canSync$.pipe(
                filter((canSync) => canSync),
                take(1), // Only sync the database once each time the dashboard is being visited
            ),
            this.synchronizeClicked$.asObservable().pipe(
                switchMap(() =>
                    pefDialogService.displayLoading(translateService.instant('text_synchronizing-data'), {
                        requestDismiss$: dismissSyncLoading$,
                    }),
                ),
            ),
        )
            .pipe(
                withLatestFrom(serverConnectionUrl$, loggedInUser$, (_, url, { username }) => ({ url, username })),
                untilDestroyed(this),
            )
            .subscribe((payload) => this.store.dispatch({ type: 'SYNC_DATABASE', payload } as DatabaseAction));

        this.uploadPreismeldungenClicked$
            .pipe(
                withLatestFrom(serverConnectionUrl$, loggedInUser$, (_, url, { username }) => ({ url, username })),
                switchMap((payload) =>
                    pefDialogService
                        .displayLoading(translateService.instant('text_synchronizing-data'), {
                            requestDismiss$: dismissSyncLoading$,
                        })
                        .pipe(map(() => payload)),
                ),
                untilDestroyed(this),
            )
            .subscribe((payload) => this.store.dispatch({ type: 'UPLOAD_DATABASE', payload } as DatabaseAction));

        loginDialogDismissed$
            .pipe(
                OO.fromFilteredSome,
                withLatestFrom(serverConnectionUrl$, (x, url) => ({ ...x, url })),
                switchMap((payload) =>
                    pefDialogService
                        .displayLoading(translateService.instant('text_synchronizing-data'), {
                            requestDismiss$: dismissLoginLoading$,
                        })
                        .pipe(map(() => payload)),
                ),
                untilDestroyed(this),
            )
            .subscribe((payload) => this.store.dispatch({ type: 'LOGIN', payload } as LoginAction));

        interval(10000)
            .pipe(startWith(0), untilDestroyed(this))
            .subscribe(() => this.store.dispatch({ type: 'CHECK_CONNECTIVITY_TO_DATABASE' } as DatabaseAction));

        merge(
            this.isSyncing$.pipe(
                filter(
                    (isSyncing) =>
                        isSyncing === SyncState.ready || (isSyncing === SyncState.error && !this.hasLoadedDataOnce),
                ),
            ),
            canConnectToDatabase$.pipe(filter((canConnect) => !canConnect && !this.hasLoadedDataOnce)),
        )
            .pipe(untilDestroyed(this))
            .subscribe(() => {
                this.hasLoadedDataOnce = true;
                this.store.dispatch({ type: 'LOAD_PREISERHEBER' });
                this.store.dispatch({ type: 'PREISMELDESTELLEN_LOAD_ALL' });
                this.store.dispatch({ type: 'PREISMELDUNG_STATISTICS_LOAD' } as StatisticsAction);
            });

        canConnectToDatabase$
            .pipe(
                skip(1),
                withLatestFrom(this.isSyncing$, (canConnect, isSyncing) => ({ canConnect, isSyncing })),
                filter(({ canConnect, isSyncing }) => canConnect && isSyncing === SyncState.none),
                untilDestroyed(this),
            )
            .subscribe(() => this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' } as LoginAction));

        this.createPmsPdf$
            .pipe(
                withLatestFrom(this.erhebungsmonat$),
                switchMap((data) =>
                    pefDialogService
                        .displayLoading(translateService.instant('dialogText_pdf-preparing-data'), {
                            requestDismiss$: this.createdPmsPdf$.pipe(
                                skip(1),
                                filter((x) => !!x),
                            ),
                        })
                        .pipe(map(() => data)),
                ),
                untilDestroyed(this),
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
            });

        this.createdPmsPdf$
            .pipe(
                skip(1),
                filter((x) => !!x && (!!x.message || x.error.error)),
                switchMap(({ message: location, error }) =>
                    this.pefMessageDialogService.displayDialogOneButton(
                        'btn_ok',
                        error
                            ? error.messageKey
                                ? error.messageKey
                                : 'dialogText_pdf-create-error'
                            : location === 'DOCUMENT_LOCATION'
                            ? 'dialogText_pdf-saved-at-documents'
                            : 'dialogText_pdf-saved-at-application',
                    ),
                ),
                untilDestroyed(this),
            )
            .subscribe();
    }

    public ngAfterViewInit() {
        this.store.dispatch({ type: 'RESET_MARKED_PREISMELDUNGEN' });
        this.store.dispatch({ type: 'RESET_WARENKORB_VIEW' });
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
        return {
            ...pms,
            keinErhebungsart: !pms.erhebungsart || (!!pms.erhebungsart && pms.erhebungsart === '000000'),
            isPdf: _erhebungsart.papierlisteVorOrt || _erhebungsart.papierlisteAbgegeben,
        };
    }
}
