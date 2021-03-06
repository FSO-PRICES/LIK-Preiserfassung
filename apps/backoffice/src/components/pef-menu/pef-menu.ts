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

import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';
import { MenuController, NavController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { interval, Observable, Subject, of } from 'rxjs';
import { filter, flatMap, map, publishReplay, refCount, startWith, take, takeUntil } from 'rxjs/operators';

import * as status from '../../actions/preismeldungen-status';
import * as fromRoot from '../../reducers';

type Page = { page: string; name: string };

@Component({
    selector: 'header[pef-menu]',
    templateUrl: 'pef-menu.html',
    styleUrls: ['pef-menu.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PefMenuComponent implements OnDestroy {
    public pages: Page[] = [
        { page: 'cockpit', name: 'Status' },
        { page: 'import', name: 'Import' },
        { page: 'preismeldestellen', name: 'PMS' },
        { page: 'pe', name: 'Preiserheber' },
        { page: 'pm', name: 'Preise' },
        { page: 'controlling', name: 'Controlling' },
        { page: 'report', name: 'Reporting' },
        { page: 'export', name: 'Export' },
    ];

    public canConnectToDatabase$: Observable<boolean>;
    public hasWritePermission$: Observable<boolean>;
    public canToggleWritePermission$: Observable<boolean>;
    public dangerZone$: Observable<boolean>;
    public reloadClicked$ = new EventEmitter();
    public onOffLineClicked$ = new EventEmitter();
    public writePermissionClicked$ = new EventEmitter();
    public toggleFullscreenClicked$ = new EventEmitter();
    public savePreismeldungStatuses$ = new EventEmitter();
    public isOffline$: Observable<boolean>;
    public isFullscreen$: Observable<boolean>;

    public pages$: Observable<(Page & { active: boolean })[]>;

    private onDestroy$ = new Subject();

    constructor(
        store: Store<fromRoot.AppState>,
        private navCtrl: NavController,
        private router: Router,
        private menu: MenuController,
    ) {
        this.dangerZone$ = store.select(fromRoot.getSettings).pipe(
            filter(settings => !!settings && !!settings.serverConnection && !!settings.serverConnection.url),
            map(settings => settings.serverConnection.url.indexOf('bfs-lik.lambda-it.ch') !== -1),
            startWith(false),
        );

        this.canConnectToDatabase$ = store.select(fromRoot.getCanConnectToDatabase).pipe(
            publishReplay(1),
            refCount(),
        );
        this.hasWritePermission$ = store.select(fromRoot.hasWritePermission);
        this.canToggleWritePermission$ = store.select(fromRoot.canToggleWritePermission);
        this.isOffline$ = store.select(fromRoot.getIsOffline);
        this.isFullscreen$ = store.select(fromRoot.getIsFullscreen);

        this.onOffLineClicked$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
            store.dispatch({ type: 'TOGGLE_ONOFFLINE' });
        });

        this.writePermissionClicked$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
            store.dispatch({ type: 'TOGGLE_WRITE_PERMISSION', payload: { force: null } });
        });

        this.toggleFullscreenClicked$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
            store.dispatch({ type: 'TOGGLE_FULLSCREEN' });
        });

        this.reloadClicked$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
            store.dispatch({ type: 'LOGOUT' });
        });

        this.savePreismeldungStatuses$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
            store.dispatch(status.createApplyPreismeldungenStatusAction());
        });

        this.pages$ = this.router.events.pipe(
            filter(isNavigationEnd),
            map(e => this.pages.map(p => ({ ...p, active: e.url.indexOf(`/${p.page}`) === 0 }))),
        );

        store
            .select(fromRoot.getSettings)
            .pipe(
                filter(settings => !!settings && !!settings.serverConnection && !!settings.serverConnection.url),
                take(1),
                flatMap(() => interval(10000).pipe(startWith(0))),
                takeUntil(this.onDestroy$),
            )
            .subscribe(() => store.dispatch({ type: 'CHECK_CONNECTIVITY_TO_DATABASE' }));
    }

    navigateToPage(page: string) {
        if (page === null) return;
        this.menu.close();
        this.navCtrl.navigateRoot(page).catch(error => {
            if (error === false) return; // If the error is just a "false" it is that the page cannot be left
            throw error;
        });
    }

    isCurrentPage(page: string) {
        return `/${page}`.indexOf(this.router.url) === 0;
    }

    trackByPageName(page: Page) {
        return page.name;
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
    }
}

function isNavigationEnd(e: Event): e is NavigationEnd {
    return e instanceof NavigationEnd;
}
