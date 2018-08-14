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

import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { NavController } from 'ionic-angular';
import { Observable, Subject } from 'rxjs';

import * as fromRoot from '../../reducers';

@Component({
    selector: 'header[pef-menu]',
    templateUrl: 'pef-menu.html',
})
export class PefMenuComponent implements OnDestroy {
    public pages = [
        { page: 'CockpitPage', pageAliases: ['CockpitPage'], name: 'Status' },
        { page: 'ImportPage', pageAliases: ['ImportPage'], name: 'Import' },
        { page: 'PreismeldestellePage', pageAliases: ['PreismeldestellePage'], name: 'PMS' },
        { page: 'PreiserheberPage', pageAliases: ['PreiserheberPage'], name: 'Preiserheber' },
        { page: 'PreismeldungPage', pageAliases: ['PreismeldungPage', 'PreismeldungByPmsPage'], name: 'Preise' },
        { page: 'ControllingPage', pageAliases: ['ControllingPage'], name: 'Controlling' },
        { page: 'ReportingPage', pageAliases: ['ReportingPage'], name: 'Reporting' },
        { page: 'ExportToPrestaPage', pageAliases: ['ExportToPrestaPage'], name: 'Export' },
    ];

    public dangerZone$: Observable<boolean>;
    public onOffLineClicked$ = new EventEmitter();
    public toggleFullscreenClicked$ = new EventEmitter();
    public isOffline$: Observable<boolean>;
    public isFullscreen$: Observable<boolean>;

    private onDestroy$ = new Subject();

    constructor(store: Store<fromRoot.AppState>, private navCtrl: NavController) {
        this.dangerZone$ = store
            .select(fromRoot.getSettings)
            .filter(settings => !!settings && !!settings.serverConnection && !!settings.serverConnection.url)
            .map(settings => settings.serverConnection.url.indexOf('bfs-lik.lambda-it.ch') !== -1)
            .startWith(false);

        this.isOffline$ = store.select(fromRoot.getIsOffline);
        this.isFullscreen$ = store.select(fromRoot.getIsFullscreen);

        this.onOffLineClicked$.takeUntil(this.onDestroy$).subscribe(() => {
            store.dispatch({ type: 'TOGGLE_ONOFFLINE' });
        });

        this.toggleFullscreenClicked$.takeUntil(this.onDestroy$).subscribe(() => {
            store.dispatch({ type: 'TOGGLE_FULLSCREEN' });
        });
    }

    navigateToPage(page) {
        if (page === null) return;
        this.navCtrl.setRoot(page, {}, { animate: false }).catch(error => {
            if (error === false) return; // If the error is just a "false" it is that the page cannot be left
            throw error;
        });
    }

    isCurrentPage(pageNames: string[]) {
        return pageNames.some(pageName => this.navCtrl.getActive().name === pageName);
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
    }
}
