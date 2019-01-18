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

    public canConnectToDatabase$: Observable<boolean>;
    public dangerZone$: Observable<boolean>;
    public reloadClicked$ = new EventEmitter();
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

        this.canConnectToDatabase$ = store
            .select(fromRoot.getCanConnectToDatabase)
            .publishReplay(1)
            .refCount();
        this.isOffline$ = store.select(fromRoot.getIsOffline);
        this.isFullscreen$ = store.select(fromRoot.getIsFullscreen);

        this.onOffLineClicked$.takeUntil(this.onDestroy$).subscribe(() => {
            store.dispatch({ type: 'TOGGLE_ONOFFLINE' });
        });

        this.toggleFullscreenClicked$.takeUntil(this.onDestroy$).subscribe(() => {
            store.dispatch({ type: 'TOGGLE_FULLSCREEN' });
        });

        this.reloadClicked$.takeUntil(this.onDestroy$).subscribe(() => {
            store.dispatch({ type: 'LOGOUT' });
        });

        store
            .select(fromRoot.getSettings)
            .filter(settings => !!settings && !!settings.serverConnection && !!settings.serverConnection.url)
            .take(1)
            .flatMap(() => Observable.interval(10000).startWith(0))
            .takeUntil(this.onDestroy$)
            .subscribe(() => store.dispatch({ type: 'CHECK_CONNECTIVITY_TO_DATABASE' }));
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
