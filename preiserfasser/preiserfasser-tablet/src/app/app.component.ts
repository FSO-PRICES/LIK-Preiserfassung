import { Store } from '@ngrx/store';
import { Component, ViewChild, OnInit, HostBinding } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';
import { StatusBar, Splashscreen, ScreenOrientation } from 'ionic-native';
import { TranslateService } from 'ng2-translate';

import * as fromRoot from '../reducers';

import { DashboardPage } from '../pages/dashboard/dashboard';
import { SettingsPage } from '../pages/settings/settings';

import { initialisePouchForDev } from '../effects/pouchdb-utils';

@Component({
    template: `
        <pef-svg-icons></pef-svg-icons>
        <ion-nav [root]="rootPage" #nav></ion-nav>`
})
export class PefApp implements OnInit {
    @ViewChild('nav') navCtrl: NavController;
    @HostBinding('class.pef-desktop') isDesktop = false;
    @HostBinding('class.pef-toolbar-right') toolbarRight = false;

    constructor(platform: Platform, private store: Store<fromRoot.AppState>, private translate: TranslateService) {

        this.initialiseLanguages();

        platform.ready().then(() => {
            // StatusBar.styleDefault();
            // StatusBar.backgroundColorByHexString('#ffffff');
            // StatusBar.backgroundColorByName('black');
            StatusBar.hide();
            Splashscreen.hide();
            if (platform.is('mobile')) {
                // remember when testing, this will fail on the desktop with "cannot read property 'apply' of undefined"
                ScreenOrientation.lockOrientation('landscape');
            }
            this.isDesktop = !platform.is('mobile');
            this.store.dispatch({ type: 'APP_CONFIG_SET_IS_DESKTOP', payload: this.isDesktop });
            this.store.dispatch({ type: 'CHECK_DATABASE_EXISTS' });
            initialisePouchForDev();
        });

        const databaseExists$ = this.store.map(x => x.database)
            .filter(x => x.databaseExists !== null)
            .map(x => x.databaseExists)
            .distinctUntilChanged()
            .publishReplay(1).refCount();

        databaseExists$
            .filter(x => x)
            .subscribe(() => {
                this.store.dispatch({ type: 'PREISMELDESTELLEN_LOAD_ALL' });
                this.store.dispatch({ type: 'LOAD_WARENKORB' });
            });
    }

    initialiseLanguages() {
        const defaultLanguage = 'de';
        this.translate.setDefaultLang(defaultLanguage);
        this.store.dispatch({ type: 'SET_AVAILABLE_LANGUAGES', payload: [defaultLanguage, 'fr', 'it'] });
        this.store.select(fromRoot.getCurrentLanguage)
            .filter(x => !!x)
            .subscribe(x => this.translate.use(x));
        this.store.dispatch({ type: 'SET_CURRENT_LANGUAGE', payload: defaultLanguage });
    }

    public ngOnInit() {
        this.store.dispatch({ type: 'LOAD_SETTINGS' });
        this.store.dispatch({ type: 'CHECK_DATABASE_LAST_UPLOADED_AT' });
        this.store.select(fromRoot.getSettings)
            .filter(setting => !!setting)
            .map(setting => !setting.isDefault)
            .take(1)
            .subscribe(areSettingsDefined => {
                if (!areSettingsDefined) {
                    this.navCtrl.setRoot(SettingsPage);
                }
                if (window.location.hash !== '#/home') {
                    this.navCtrl.setRoot(DashboardPage);
                }
            });
    }
}
