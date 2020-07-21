import { Component, HostBinding, NgZone, OnInit } from '@angular/core';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { NavController, Platform } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ElectronService } from 'ngx-electron';
import { interval } from 'rxjs';
import {
    distinctUntilChanged,
    filter,
    flatMap,
    map,
    publishReplay,
    refCount,
    startWith,
    take,
    withLatestFrom,
} from 'rxjs/operators';

import { PefDialogService, translations } from '@lik-shared';

import * as setting from '../actions/setting';
import { getOrCreateClientId } from '../common/local-storage-utils';
import { createIndexes } from '../common/user-db-values';
import { PefDialogLoginComponent } from '../components/pef-dialog-login/pef-dialog-login';
import * as fromRoot from '../reducers';
import { AppService } from '../services/app-service';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class Backoffice implements OnInit {
    @HostBinding('class') classes = 'pef-desktop';
    @HostBinding('class.fullscreen') fullscreen = false;

    public initialized = false;
    public rootPage = 'CockpitPage';

    constructor(
        private navCtrl: NavController,
        private appService: AppService,
        private store: Store<fromRoot.AppState>,
        platform: Platform,
        pefDialogService: PefDialogService,
        statusBar: StatusBar,
        translateService: TranslateService,
        splashScreen: SplashScreen,
        electronService: ElectronService,
        zone: NgZone,
    ) {
        this.appService
            .clearLocalDatabases()
            .catch()
            .then(() => {
                this.initialized = true;

                const settings$ = store.select(fromRoot.getSettings).pipe(
                    publishReplay(1),
                    refCount(),
                );

                const loginDialog$ = store.select(fromRoot.getIsLoggedIn).pipe(
                    filter(loggedIn => loggedIn === false),
                    withLatestFrom(settings$),
                    filter(([, settings]) => !!settings && !settings.isDefault),
                    flatMap(() => pefDialogService.displayDialog(PefDialogLoginComponent, {}).pipe(map(x => x.data))),
                    publishReplay(1),
                    refCount(),
                );

                platform.ready().then(() => {
                    // Okay, so the platform is ready and our plugins are available.
                    // Here you can do any higher level native things you might need.
                    statusBar.hide();
                    splashScreen.hide();
                });

                store.select(fromRoot.getIsFullscreen).subscribe(isFullscreen => {
                    this.fullscreen = isFullscreen;
                });

                if (electronService.isElectronApp) {
                    store.select(fromRoot.hasWritePermission).subscribe(hasWritePermission => {
                        electronService.ipcRenderer.sendSync('update-has-write-permission', hasWritePermission);
                    });

                    electronService.ipcRenderer.on('app-is-closing', () => {
                        zone.run(() => {
                            store.dispatch({ type: 'TOGGLE_WRITE_PERMISSION', payload: { force: false } });
                        });
                    });
                }

                settings$
                    .pipe(
                        filter(setting => !!setting && setting.isDefault),
                        distinctUntilChanged(),
                        take(1),
                    )
                    .subscribe(() => this.navigateToSettings());

                loginDialog$
                    .pipe(filter(dialogCode => dialogCode === 'LOGGED_IN'))
                    .subscribe(() => console.log('sucessfully logged in'));

                loginDialog$
                    .pipe(filter(dialogCode => dialogCode === 'NAVIGATE_TO_SETTINGS'))
                    .subscribe(() => this.navigateToSettings());

                this.store
                    .select(fromRoot.getIsLoggedIn)
                    .pipe(
                        filter(loggedIn => loggedIn),
                        take(1),
                        flatMap(() => createIndexes()),
                    )
                    .subscribe();

                translateService.setTranslation('de', translations.de);
                translateService.use('de');
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
                            settings => !!settings && !!settings.serverConnection && !!settings.serverConnection.url,
                        ),
                        take(1),
                        flatMap(() => interval(10000).pipe(startWith(0))),
                    )
                    .subscribe(() => store.dispatch({ type: 'LOAD_WRITE_PERMISSION' }));
            });

        if (electronService.isElectronApp) {
            const FindInPage = require('electron-find').FindInPage;
            const findInPage = new FindInPage(electronService.remote.getCurrentWebContents());
            document.addEventListener('keypress', (ev: KeyboardEvent) => {
                if (ev.ctrlKey && ev.keyCode === 6) {
                    // CTRL + F
                    findInPage.openFindWindow();
                }
            });
        }
    }

    public ngOnInit() {}

    public navigateToSettings() {
        return this.navCtrl.navigateRoot(['settings']);
    }
}
