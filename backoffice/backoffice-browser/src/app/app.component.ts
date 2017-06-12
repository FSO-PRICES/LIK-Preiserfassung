import { Component, HostBinding, ViewChild, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Platform, NavController } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';
import { Observable } from 'rxjs';

import { PefDialogService } from 'lik-shared';

import * as fromRoot from '../reducers';
import { PreiserheberPage } from '../pages/preiserheber/preiserheber';
import { PefDialogLoginComponent } from '../components/pef-dialog-login/pef-dialog-login';
import { SettingsPage } from '../pages/settings/settings';

@Component({
    templateUrl: 'app.html'
})
export class Backoffice implements OnInit {
    @HostBinding('class') classes = 'app-root pef-desktop';
    @ViewChild('nav') navCtrl: NavController;

    public rootPage = PreiserheberPage;

    constructor(platform: Platform, private pefDialogService: PefDialogService, private store: Store<fromRoot.AppState>) {
        const loginDialog$ = store.select(fromRoot.getIsLoggedIn)
            .filter(isLoggedIn => isLoggedIn != null && !isLoggedIn) // Only check if logged in if a result is given
            .flatMap(() => pefDialogService.displayDialog(PefDialogLoginComponent, {}).map(x => x.data))
            .publishReplay(1).refCount();

        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            StatusBar.styleDefault();
            Splashscreen.hide();
        });

        this.store.select(fromRoot.getSettings)
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
        return this.navCtrl.setRoot(SettingsPage, {}, { animate: false });
    }
}
