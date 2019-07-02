import { Component, HostBinding, OnInit } from '@angular/core';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Platform } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { distinctUntilChanged, filter, map, publishReplay, refCount } from 'rxjs/operators';

import { translations } from '@lik-shared';
import { initialisePouchForDev } from '../effects/pouchdb-utils';
import { environment } from '../environments/environment';
import * as fromRoot from '../reducers';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
    @HostBinding('class.pef-desktop') isDesktop = false;
    @HostBinding('class.pef-toolbar-right') toolbarRight = false;

    constructor(
        platform: Platform,
        private store: Store<fromRoot.AppState>,
        private translate: TranslateService,
        private statusBar: StatusBar,
        private splashScreen: SplashScreen,
        screenOrientation: ScreenOrientation,
    ) {
        platform.ready().then(() => {
            if (platform.is('mobile')) {
                // remember when testing, this will fail on the desktop with "cannot read property 'apply' of undefined"
                screenOrientation.lock('landscape');
            }
            this.store.dispatch({ type: 'SET_VERSION', payload: environment.version });
            this.isDesktop = !platform.is('mobile');
            this.store.dispatch({ type: 'APP_CONFIG_SET_IS_DESKTOP', payload: this.isDesktop });
            this.store.dispatch({ type: 'CHECK_DATABASE_EXISTS' });
            this.initialiseLanguages();
            initialisePouchForDev();
            this.statusBar.styleDefault();
            this.splashScreen.hide();
        });

        const databaseExists$ = this.store
            .select(x => x.database.databaseExists)
            .pipe(
                filter(databaseExists => databaseExists !== null),
                distinctUntilChanged(),
                publishReplay(1),
                refCount(),
            );

        databaseExists$.pipe(filter(x => x)).subscribe(() => {
            this.store.dispatch({ type: 'LOAD_ERHEBUNGSINFO' });
            this.store.dispatch({ type: 'LOAD_PREISERHEBER' });
            this.store.dispatch({ type: 'PREISMELDESTELLEN_LOAD_ALL' });
            this.store.dispatch({ type: 'LOAD_WARENKORB' });
        });

        this.store
            .select(fromRoot.getPreiserheber)
            .pipe(
                filter(p => !!p),
                map(p => p.languageCode),
                filter(languageCode => !!languageCode),
            )
            .subscribe(languageCode => this.store.dispatch({ type: 'SET_CURRENT_LANGUAGE', payload: languageCode }));
    }

    initialiseLanguages() {
        this.translate.setDefaultLang('dummy'); // so that untranslated texts get shown as raw keys
        Object.keys(translations).forEach(lang => this.translate.setTranslation(lang, translations[lang]));
        this.store.dispatch({ type: 'SET_AVAILABLE_LANGUAGES', payload: Object.keys(translations) });
        this.store
            .select(fromRoot.getCurrentLanguage)
            .pipe(filter(x => !!x))
            .subscribe(x => {
                this.translate.use(x);
            });
        this.store.dispatch({ type: 'SET_CURRENT_LANGUAGE', payload: 'de' });
    }

    public ngOnInit() {
        this.store.dispatch({ type: 'LOAD_SETTINGS' });
        this.store.dispatch({ type: 'CHECK_DATABASE_LAST_UPLOADED_AT' });
        // TODO Fix initial redirecting
        // this.navCtrl.viewDidEnter
        //     .filter(event => event.name != 'SettingsPage')
        //     .flatMap(
        //         event => this.store.select(fromRoot.getSettings).take(1),
        //         (event, settings) => ({ event, settings }),
        //     )
        //     .subscribe(({ event, settings }) => {
        //         if (!!settings && settings.isDefault) {
        //             this.navCtrl.setRoot('SettingsPage');
        //         }
        //     });
        // this.store
        //     .select(fromRoot.getSettings)
        //     .filter(setting => !!setting && setting.isDefault)
        //     .take(1)
        //     .subscribe(setting => {
        //         if (setting.isDefault) {
        //             this.rootPage = 'SettingsPage';
        //         }
        //     });
    }
}
