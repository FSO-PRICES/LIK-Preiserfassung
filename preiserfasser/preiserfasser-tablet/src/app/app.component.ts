import { Store } from '@ngrx/store';
import { Component, ViewChild, OnInit, HostBinding } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { TranslateService } from '@ngx-translate/core';

import * as fromRoot from '../reducers';

import * as PouchDB from 'pouchdb';

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

    rootPage = 'DashboardPage';

    constructor(platform: Platform, private store: Store<fromRoot.AppState>, private translate: TranslateService, private statusBar: StatusBar, private splashScreen: SplashScreen, private screenOrientation: ScreenOrientation) {

        platform.ready().then(() => {
            if (platform.is('mobile')) {
                // remember when testing, this will fail on the desktop with "cannot read property 'apply' of undefined"
                screenOrientation.lock('landscape');
            }
            this.isDesktop = !platform.is('mobile');
            this.store.dispatch({ type: 'APP_CONFIG_SET_IS_DESKTOP', payload: this.isDesktop });
            this.store.dispatch({ type: 'CHECK_DATABASE_EXISTS' });
            this.initialiseLanguages();
            initialisePouchForDev();
            statusBar.hide();
            splashScreen.hide();
        });

        const databaseExists$ = this.store.select(x => x.database.databaseExists)
            .filter(databaseExists => databaseExists !== null)
            .distinctUntilChanged()
            .publishReplay(1).refCount();

        databaseExists$
            .filter(x => x)
            .subscribe(() => {
                this.store.dispatch({ type: 'LOAD_ERHEBUNGSINFO' });
                this.store.dispatch({ type: 'LOAD_PREISERHEBER' });
                this.store.dispatch({ type: 'PREISMELDESTELLEN_LOAD_ALL' });
                this.store.dispatch({ type: 'LOAD_WARENKORB' });
            });

        this.store.select(fromRoot.getPreiserheber)
            .filter(p => !!p)
            .map(p => p.languageCode)
            .filter(languageCode => !!languageCode)
            .subscribe(languageCode => this.store.dispatch({ type: 'SET_CURRENT_LANGUAGE', payload: languageCode }));
    }

    initialiseLanguages() {
        this.translate.setDefaultLang('dummy'); // so that untranslated texts get shown as raw keys
        this.store.dispatch({ type: 'SET_AVAILABLE_LANGUAGES', payload: ['de', 'en', 'fr', 'it'] });
        this.store.select(fromRoot.getCurrentLanguage)
            .filter(x => !!x)
            .subscribe(x => {
                this.translate.use(x);
            });
        this.store.dispatch({ type: 'SET_CURRENT_LANGUAGE', payload: 'de' });
    }

    public ngOnInit() {
        this.store.dispatch({ type: 'LOAD_SETTINGS' });
        this.store.dispatch({ type: 'CHECK_DATABASE_LAST_UPLOADED_AT' });
        this.store.select(fromRoot.getSettings)
            .filter(setting => !!setting)
            .map(setting => !setting.isDefault)
            .take(1)
            .flatMap(areSettingsDefined => !areSettingsDefined ? this.navCtrl.setRoot('SettingsPage') : Promise.resolve())
            .subscribe();
    }
}
