import { Component, HostBinding, ViewChild, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Platform, NavController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Observable } from 'rxjs';

import { PefDialogService } from 'lik-shared';

import * as fromRoot from '../reducers';
import { PefDialogLoginComponent } from '../components/pef-dialog-login/pef-dialog-login';

@Component({
    templateUrl: 'app.html'
})
export class Backoffice implements OnInit {
    @HostBinding('class') classes = 'app-root pef-desktop';
    @ViewChild('nav') navCtrl: NavController;

    public rootPage = 'PreiserheberPage';

    constructor(platform: Platform, private pefDialogService: PefDialogService, private store: Store<fromRoot.AppState>, private statusBar: StatusBar, private splashScreen: SplashScreen) {
        // Skip 1 is used to skip the first initial value and to wait for the new value after the dispatch
        const settings$ = store.select(fromRoot.getSettings).skip(1).publishReplay(1).refCount();
        const loginDialog$ = store.select(fromRoot.getIsLoggedIn).skip(1)
            .withLatestFrom(settings$, (isLoggedIn, settings) => ({ isLoggedIn, settings }))
            .filter(({ isLoggedIn, settings }) => !!settings && !settings.isDefault && isLoggedIn != null && !isLoggedIn)
            .flatMap(() => pefDialogService.displayDialog(PefDialogLoginComponent, {}).map(x => x.data))
            .publishReplay(1).refCount();

        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            statusBar.hide();
            splashScreen.hide();
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
    }

    public ngOnInit() {
        this.store.dispatch({ type: 'SETTING_LOAD' });
    }

    public navigateToSettings() {
        return this.navCtrl.setRoot('SettingsPage', {}, { animate: false });
    }
}
