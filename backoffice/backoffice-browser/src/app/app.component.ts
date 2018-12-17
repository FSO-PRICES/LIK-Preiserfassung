import { Component, HostBinding, ViewChild, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Platform, NavController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { PefDialogService, translations } from 'lik-shared';

import * as fromRoot from '../reducers';
import { PefDialogLoginComponent } from '../components/pef-dialog-login/pef-dialog-login';
import { AppService } from '../services/app-service';
import { getLocalDatabase } from '../common/pouchdb-utils/database';

@Component({
    templateUrl: 'app.html',
})
export class Backoffice implements OnInit {
    @HostBinding('class') classes = 'app-root pef-desktop';
    @HostBinding('class.fullscreen') fullscreen = false;
    @ViewChild('nav') navCtrl: NavController;

    public initialized = false;
    public rootPage = 'CockpitPage';

    constructor(
        platform: Platform,
        private appService: AppService,
        private pefDialogService: PefDialogService,
        private store: Store<fromRoot.AppState>,
        private statusBar: StatusBar,
        private translateService: TranslateService,
        private splashScreen: SplashScreen
    ) {
        this.appService
            .clearLocalDatabases()
            .catch()
            .then(() => {
                this.initialized = true;

                // Skip 1 is used to skip the first initial value and to wait for the new value after the dispatch
                const settings$ = store
                    .select(fromRoot.getSettings)
                    .skip(1)
                    .publishReplay(1)
                    .refCount();

                const loginDialog$ = store
                    .select(fromRoot.getIsLoggedIn)
                    .skip(1)
                    .withLatestFrom(settings$, (isLoggedIn, settings) => ({ isLoggedIn, settings }))
                    .filter(
                        ({ isLoggedIn, settings }) =>
                            !!settings && !settings.isDefault && isLoggedIn != null && !isLoggedIn
                    )
                    .flatMap(() => pefDialogService.displayDialog(PefDialogLoginComponent, {}).map(x => x.data))
                    .publishReplay(1)
                    .refCount();

                platform.ready().then(() => {
                    // Okay, so the platform is ready and our plugins are available.
                    // Here you can do any higher level native things you might need.
                    statusBar.hide();
                    splashScreen.hide();
                });

                store.select(fromRoot.getIsFullscreen).subscribe(isFullscreen => {
                    this.fullscreen = isFullscreen;
                });

                settings$
                    .filter(setting => !!setting && setting.isDefault)
                    .distinctUntilChanged()
                    .take(1)
                    .subscribe(() => this.navigateToSettings());

                loginDialog$
                    .filter(dialogCode => dialogCode === 'LOGGED_IN')
                    .subscribe(() => console.log('sucessfully logged in'));

                loginDialog$
                    .filter(dialogCode => dialogCode === 'NAVIGATE_TO_SETTINGS')
                    .subscribe(() => this.navigateToSettings());

                translateService.setTranslation('de', translations.de);
                translateService.use('de');
            });
    }

    public ngOnInit() {
        this.store.dispatch({ type: 'SETTING_LOAD' });
        this.store.dispatch({ type: 'LOAD_ONOFFLINE' });
        this.store.dispatch({ type: 'LOAD_WARENKORB' });
    }

    public navigateToSettings() {
        return this.navCtrl.setRoot('SettingsPage', {}, { animate: false });
    }
}
