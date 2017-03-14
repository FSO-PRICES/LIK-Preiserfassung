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
            .filter(x => x != null && !x) // Only check if logged in if a result is given
            .switchMap(() => Observable.defer(() => pefDialogService.displayDialog(PefDialogLoginComponent, {}).map(x => x.data)));

        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            StatusBar.styleDefault();
            Splashscreen.hide();
        });

        loginDialog$
            .filter(dialogCode => dialogCode === 'THROW_CHANGES')
            .take(1)
            .subscribe(() => console.log('sucessfully logged in'));

        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
    }

    public ngOnInit() {
        this.store.select(fromRoot.getSettings)
            .filter(setting => !!setting && setting.isDefault)
            .take(1)
            .subscribe(() => this.navCtrl.setRoot(SettingsPage, {}, { animate: true, direction: 'right' }));
    }
}
