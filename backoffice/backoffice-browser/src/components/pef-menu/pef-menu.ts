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
        { page: 'CockpitPage', name: 'Status' },
        { page: 'ImportPage', name: 'Import' },
        { page: 'PreismeldestellePage', name: 'PMS' },
        { page: 'PreiserheberPage', name: 'Preiserheber' },
        { page: 'PreismeldungPage', name: 'Preise' },
        { page: 'ControllingPage', name: 'Controlling' },
        { page: null, name: 'Reporting' },
        { page: 'ExportToPrestaPage', name: 'Export' },
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

    isCurrentPage(pageName) {
        return this.navCtrl.getActive().name === pageName;
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
    }
}
