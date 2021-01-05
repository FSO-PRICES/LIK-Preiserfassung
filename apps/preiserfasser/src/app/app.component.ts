/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { Component, HostBinding, OnInit } from '@angular/core';
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

    constructor(
        platform: Platform,
        private store: Store<fromRoot.AppState>,
        private translate: TranslateService,
        private statusBar: StatusBar,
        private splashScreen: SplashScreen,
    ) {
        platform.ready().then(() => {
            const isMobile = platform.is('mobile');
            if (isMobile) {
                // remember when testing, this will fail on the desktop with "cannot read property 'apply' of undefined"
                // As specified by Stefan the portrait mode should be also available https://github.com/Lambda-IT/lik-studio/issues/461
                // screenOrientation.lock(screenOrientation.ORIENTATIONS.LANDSCAPE);
            }
            this.store.dispatch({ type: 'SET_VERSION', payload: environment.version });
            this.isDesktop = !isMobile;
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

    ionViewDidEnter() {}

    public ngOnInit() {
        this.store.dispatch({ type: 'LOAD_SETTINGS' });
        this.store.dispatch({ type: 'CHECK_DATABASE_LAST_UPLOADED_AT' });
    }
}
