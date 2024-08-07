import { Dialog } from '@angular/cdk/dialog';
import { Component, HostBinding, NgZone } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { FindInPage } from 'electron-find';
import { combineLatest, interval, merge, of, timer } from 'rxjs';
import {
    delay,
    distinctUntilChanged,
    filter,
    flatMap,
    mergeMap,
    publishReplay,
    refCount,
    shareReplay,
    skip,
    startWith,
    take,
    takeUntil,
    withLatestFrom,
} from 'rxjs/operators';

import { ElectronService, PefDialogService, partition, translations } from '@lik-shared';

import * as status from '../actions/preismeldungen-status';
import * as setting from '../actions/setting';
import {
    getIsPouchdbDirty,
    getLastUsedLanguage,
    getOrCreateClientId,
    setLastUsedLanguage,
} from '../common/local-storage-utils';
import { dbNames, dropLocalDatabase } from '../common/pouchdb-utils';
import { createIndexes } from '../common/user-db-values';
import { PefDialogLoginComponent, PefDialogLoginResult } from '../components/pef-dialog-login/pef-dialog-login';
import * as fromRoot from '../reducers';
import { AppService } from '../services/app-service';

@UntilDestroy()
@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class Backoffice {
    @HostBinding('class') classes = 'pef-desktop';
    @HostBinding('class.fullscreen') fullscreen = false;

    public initialized = false;
    public rootPage = 'CockpitPage';

    constructor(
        private router: Router,
        private appService: AppService,
        private store: Store<fromRoot.AppState>,
        private translateService: TranslateService,
        private title: Title,
        private electronService: ElectronService,
        pefDialogService: PefDialogService,
        private dialog: Dialog,
        zone: NgZone,
    ) {
        window.__translate = translateService;
        this.appService
            .clearLocalDatabases()
            .catch()
            .then(() => {
                this.initialized = true;

                const settings$ = store.select(fromRoot.getSettings).pipe(publishReplay(1), refCount());

                const loginDialog$ = store.select(fromRoot.getIsLoggedIn).pipe(
                    filter((loggedIn) => loggedIn === false),
                    withLatestFrom(settings$),
                    filter(([, settings]) => !!settings && !settings.isDefault),
                    mergeMap(() => {
                        const dialogRef = dialog.open<PefDialogLoginResult>(PefDialogLoginComponent, {
                            disableClose: true,
                        });
                        return dialogRef.closed;
                    }),
                    shareReplay({ bufferSize: 1, refCount: true }),
                );

                store.select(fromRoot.getIsFullscreen).subscribe((isFullscreen) => {
                    this.fullscreen = isFullscreen;
                });

                if (electronService.isElectronApp) {
                    combineLatest([
                        store.select(fromRoot.hasWritePermission),
                        store.select(fromRoot.getArePreismeldungenStatusSyncing),
                        store.select(fromRoot.getPreismeldungenStatusMap),
                    ]).subscribe(([hasWritePermission, isSyncing, sm]) => {
                        electronService.ipcRenderer.sendSync('update-app-state', {
                            hasWritePermission,
                            isSyncing,
                            hasChanges: getIsPouchdbDirty(),
                        });
                    });

                    let alreadyClosing = false;
                    const handleClosing = (save: boolean) => {
                        if (alreadyClosing) {
                            return;
                        }
                        alreadyClosing = true;
                        zone.run(() => {
                            const [hasWritePermission$, noWritePerrmission$] = partition(
                                store
                                    .select(fromRoot.hasWritePermission)
                                    .pipe(shareReplay({ bufferSize: 1, refCount: true })),
                                (hasWritePermission) => hasWritePermission,
                            );
                            const isSyncing$ = store
                                .select(fromRoot.getArePreismeldungenStatusSyncing)
                                .pipe(shareReplay({ bufferSize: 1, refCount: true }));
                            if (save) {
                                store.dispatch(status.createApplyPreismeldungenStatusAction());
                            }
                            const discardOrSave$ = save ? of(null) : dropLocalDatabase(dbNames.preismeldungen_status);
                            store.dispatch({ type: 'TOGGLE_WRITE_PERMISSION', payload: { force: false } });
                            const permitted$ = merge(
                                hasWritePermission$.pipe(skip(1), delay(0), take(1)),
                                noWritePerrmission$,
                            ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
                            const whenReady$ = combineLatest([permitted$, isSyncing$, discardOrSave$]).pipe(
                                filter(([, isSyncing]) => !isSyncing),
                                shareReplay({ bufferSize: 1, refCount: true }),
                            );
                            pefDialogService
                                .displayLoading(
                                    this.translateService.instant('label.standard.wird_synchronisiert_bitte_warten'),
                                    {
                                        requestDismiss$: whenReady$,
                                    },
                                )
                                .pipe(take(1))
                                .subscribe();
                            merge(whenReady$, timer(25000).pipe(takeUntil(permitted$), take(1))).subscribe(() => {
                                electronService.ipcRenderer.send('can-close');
                            });
                        });
                    };
                    electronService.ipcRenderer.on('save-before-closing', () => handleClosing(true));
                    electronService.ipcRenderer.on('discard-before-closing', () => handleClosing(false));
                    electronService.ipcRenderer.on('complete-before-closing', () => handleClosing(false));
                }

                settings$
                    .pipe(
                        filter((setting) => !!setting && setting.isDefault),
                        distinctUntilChanged(),
                        take(1),
                    )
                    .subscribe(() => this.navigateToSettings());

                loginDialog$
                    .pipe(
                        filter((dialogCode) => dialogCode === 'LOGGED_IN'),
                        untilDestroyed(this),
                    )

                    .subscribe(() => console.log('sucessfully logged in'));

                loginDialog$
                    .pipe(
                        filter((dialogCode) => dialogCode === 'NAVIGATE_TO_SETTINGS'),
                        untilDestroyed(this),
                    )
                    .subscribe(() => this.navigateToSettings());

                this.store
                    .select(fromRoot.getIsLoggedIn)
                    .pipe(
                        filter((loggedIn) => loggedIn),
                        take(1),
                        flatMap(() => createIndexes()),
                    )
                    .subscribe();

                this.initializeLanguages();
                this.store.dispatch({ type: 'SET_CURRENT_CLIENT_ID', payload: getOrCreateClientId() });
                this.store.dispatch({ type: 'SETTING_LOAD' });
                this.store.dispatch({ type: 'LOAD_ONOFFLINE' });
                this.store.dispatch({ type: 'LOAD_WRITE_PERMISSION' });
                this.store.dispatch({ type: 'LOAD_WARENKORB' });
                this.store.dispatch(setting.loadSedex());

                store
                    .select(fromRoot.getSettings)
                    .pipe(
                        filter(
                            (settings) => !!settings && !!settings.serverConnection && !!settings.serverConnection.url,
                        ),
                        take(1),
                        flatMap(() => interval(10000).pipe(startWith(0))),
                    )
                    .subscribe(() => store.dispatch({ type: 'LOAD_WRITE_PERMISSION' }));
            });

        if (electronService.isElectronApp) {
            if (window.electronRemote?.getCurrentWebContents) {
                const findInPage = new FindInPage(window.electronRemote?.getCurrentWebContents());
                document.addEventListener('keypress', (ev: KeyboardEvent) => {
                    if (ev.ctrlKey && ev.keyCode === 6) {
                        // CTRL + F
                        findInPage.openFindWindow();
                    }
                });
            }
        }
    }

    private initializeLanguages() {
        const languages = Object.keys(translations);
        languages.forEach((lang) => this.translateService.setTranslation(lang, translations[lang]));

        const prevLanguage = getLastUsedLanguage();
        const initLanguage = languages.includes(prevLanguage) ? prevLanguage : 'de';
        this.translateService.use(initLanguage);

        this.translateService.stream('settings.version').subscribe((value) => {
            this.title.setTitle(value);
        });
        this.store.dispatch({ type: 'SET_AVAILABLE_LANGUAGES', payload: Object.keys(translations) });
        this.store
            .select(fromRoot.getCurrentLanguage)
            .pipe(
                skip(1),
                filter((x) => !!x),
            )
            .subscribe((lang) => {
                console.log('observable language changed to', lang);
                this.translateService.use(lang);
                setLastUsedLanguage(lang);
            });
        this.store.dispatch({ type: 'SET_CURRENT_LANGUAGE', payload: initLanguage });

        if (this.electronService.isElectronApp) {
            const translations = [
                'electron.quit.unsaved',
                'electron.quit.unsaved-unable-to-save',
                'electron.app.invalid-state-title',
                'electron.app.invalid-state-text',
            ];
            this.translateService.stream(translations).subscribe((translations) => {
                this.electronService.ipcRenderer.send('set-translations', translations);
            });
        }
    }

    public navigateToSettings() {
        return this.router.navigate(['settings']);
    }
}
