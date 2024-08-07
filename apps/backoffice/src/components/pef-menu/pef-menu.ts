import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Observable, Subject, interval } from 'rxjs';
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
        { page: 'cockpit', name: 'menu.cockpit' },
        { page: 'import', name: 'menu.import' },
        { page: 'preismeldestellen', name: 'menu.preismeldestellen' },
        { page: 'pe', name: 'menu.preiserheber' },
        { page: 'pm', name: 'menu.preise' },
        { page: 'controlling', name: 'menu.controlling' },
        { page: 'report', name: 'menu.report' },
        { page: 'export', name: 'menu.export' },
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

    private onDestroy$ = new Subject<void>();

    constructor(store: Store<fromRoot.AppState>, private router: Router, private menu: MenuController) {
        this.dangerZone$ = store.select(fromRoot.getSettings).pipe(
            filter((settings) => !!settings && !!settings.serverConnection && !!settings.serverConnection.url),
            map((settings) => settings.serverConnection.url.indexOf('bfs-lik.lambda-it.ch') !== -1),
            startWith(false),
        );

        this.canConnectToDatabase$ = store.select(fromRoot.getCanConnectToDatabase).pipe(publishReplay(1), refCount());
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
            map((e) => this.pages.map((p) => ({ ...p, active: e.url.indexOf(`/${p.page}`) === 0 }))),
        );

        store
            .select(fromRoot.getSettings)
            .pipe(
                filter((settings) => !!settings && !!settings.serverConnection && !!settings.serverConnection.url),
                take(1),
                flatMap(() => interval(10000).pipe(startWith(0))),
                takeUntil(this.onDestroy$),
            )
            .subscribe(() => store.dispatch({ type: 'CHECK_CONNECTIVITY_TO_DATABASE' }));
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
