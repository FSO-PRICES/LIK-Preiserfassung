import { Component, HostBinding, OnInit } from '@angular/core';
import { StatusBar } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { distinctUntilChanged, filter, map, publishReplay, refCount } from 'rxjs/operators';

import { translations } from '@lik-shared';

import { initialisePouchForDev } from '../effects/pouchdb-utils';
import { environment } from '../environments/environment';
import * as fromRoot from '../reducers';
import { SettingsActions } from '../state/settings/settings.actions';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
    @HostBinding('class.pef-desktop') isDesktop = false;

    constructor(platform: Platform, private store: Store<fromRoot.AppState>, private translate: TranslateService) {
        platform.ready().then(() => {
            const isMobile = platform.is('mobile');
            if (isMobile) {
                // remember when testing, this will fail on the desktop with "cannot read property 'apply' of undefined"
                // As specified by Stefan the portrait mode should be also available https://github.com/Lambda-IT/lik-xstudio/issues/461
                // screenOrientation.lock(screenOrientation.ORIENTATIONS.LANDSCAPE);
            }
            this.store.dispatch(SettingsActions.setVersion({ version: environment.version }));
            this.isDesktop = !isMobile;
            this.store.dispatch({ type: 'APP_CONFIG_SET_IS_DESKTOP', payload: this.isDesktop });
            this.store.dispatch({ type: 'CHECK_DATABASE_EXISTS' });
            this.initialiseLanguages();
            initialisePouchForDev();
            if (platform.is('capacitor')) {
                hideStatusBar();
            }
        });

        const hideStatusBar = async () => {
            await StatusBar.hide();
        };

        const databaseExists$ = this.store
            .select((x) => x.database.databaseExists)
            .pipe(
                filter((databaseExists) => databaseExists !== null),
                distinctUntilChanged(),
                publishReplay(1),
                refCount(),
            );

        databaseExists$.pipe(filter((x) => x)).subscribe(() => {
            this.store.dispatch({ type: 'LOAD_ERHEBUNGSINFO' });
            this.store.dispatch({ type: 'LOAD_WARENKORB' });
        });

        this.store
            .select(fromRoot.getPreiserheber)
            .pipe(
                filter((p) => !!p),
                map((p) => p.languageCode),
                filter((languageCode) => !!languageCode),
            )
            .subscribe((languageCode) => this.store.dispatch({ type: 'SET_CURRENT_LANGUAGE', payload: languageCode }));
    }

    initialiseLanguages() {
        this.translate.setDefaultLang('dummy'); // so that untranslated texts get shown as raw keys
        Object.keys(translations).forEach((lang) => this.translate.setTranslation(lang, translations[lang]));
        this.store.dispatch({ type: 'SET_AVAILABLE_LANGUAGES', payload: Object.keys(translations) });
        this.store
            .select(fromRoot.getCurrentLanguage)
            .pipe(filter((x) => !!x))
            .subscribe((x) => {
                this.translate.use(x);
            });
        this.store.dispatch({ type: 'SET_CURRENT_LANGUAGE', payload: 'de' });
    }

    public ngOnInit() {
        this.store.dispatch(SettingsActions.loadServerConnectionUrl());
        this.store.dispatch({ type: 'CHECK_DATABASE_LAST_UPLOADED_AT' });
    }
}
