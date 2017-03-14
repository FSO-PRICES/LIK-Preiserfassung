import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { LoadingController, Loading } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../../reducers';

@Component({
    templateUrl: 'export-to-presta.html'
})
export class ExportToPrestaPage implements OnDestroy {
    public preismeldungenExportCompleted$ = new EventEmitter<number>();

    public preismeldungen$: Observable<P.CompletePreismeldung[]>;
    public arePreismeldungenLoaded$: Observable<boolean>;

    private subscriptions: Subscription[];
    private loader: Loading;

    constructor(private store: Store<fromRoot.AppState>, private loadingCtrl: LoadingController) {
        this.preismeldungen$ = store.select(fromRoot.getPreismeldungen).publishReplay(1).refCount();
        this.arePreismeldungenLoaded$ = store.select(fromRoot.getPreismeldungenAreLoaded).publishReplay(1).refCount();

        this.subscriptions = [
            this.arePreismeldungenLoaded$
                .filter(x => !!x)
                .subscribe(() => this.dismissLoadingScreen())
        ];
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'PREISMELDUNG_LOAD' });
        this.presentLoadingScreen();
    }

    public ngOnDestroy() {
        if (!this.subscriptions || this.subscriptions.length === 0) return;
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }

    private presentLoadingScreen() {
        this.dismissLoadingScreen();

        this.loader = this.loadingCtrl.create({
            content: 'Datensynchronisierung. Bitte warten...'
        });

        this.loader.present();
    }

    private dismissLoadingScreen() {
        if (!!this.loader) {
            this.loader.dismiss();
        }
    }
}
