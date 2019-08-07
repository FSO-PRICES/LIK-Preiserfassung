import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { interval, Observable, Subject } from 'rxjs';
import { filter, flatMap, map, publishReplay, refCount, startWith, take, takeUntil } from 'rxjs/operators';

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
    public dangerZone$: Observable<boolean>;
    public reloadClicked$ = new EventEmitter();
    public onOffLineClicked$ = new EventEmitter();
    public toggleFullscreenClicked$ = new EventEmitter();
    public isOffline$: Observable<boolean>;
    public isFullscreen$: Observable<boolean>;

    private onDestroy$ = new Subject();

    constructor(store: Store<fromRoot.AppState>, private navCtrl: NavController, private router: Router) {
        this.dangerZone$ = store.select(fromRoot.getSettings).pipe(
            filter(settings => !!settings && !!settings.serverConnection && !!settings.serverConnection.url),
            map(settings => settings.serverConnection.url.indexOf('bfs-lik.lambda-it.ch') !== -1),
            startWith(false),
        );

        this.canConnectToDatabase$ = store.select(fromRoot.getCanConnectToDatabase).pipe(
            publishReplay(1),
            refCount(),
        );
        this.isOffline$ = store.select(fromRoot.getIsOffline);
        this.isFullscreen$ = store.select(fromRoot.getIsFullscreen);

        this.onOffLineClicked$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
            store.dispatch({ type: 'TOGGLE_ONOFFLINE' });
        });

        this.toggleFullscreenClicked$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
            store.dispatch({ type: 'TOGGLE_FULLSCREEN' });
        });

        this.reloadClicked$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
            store.dispatch({ type: 'LOGOUT' });
        });

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
        this.navCtrl.navigateRoot(page).catch(error => {
            if (error === false) return; // If the error is just a "false" it is that the page cannot be left
            throw error;
        });
    }

    isCurrentPage(page: string) {
        return this.router.url.indexOf(page) >= 0;
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
    }
}
