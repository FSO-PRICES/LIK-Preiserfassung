import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { LoadingController, Loading } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';

import { Models as P } from 'lik-shared';

import * as exporter from '../../actions/exporter';
import * as fromRoot from '../../reducers';

@Component({
    templateUrl: 'export-to-presta.html'
})
export class ExportToPrestaPage implements OnDestroy {
    public startPreismeldungenExport$ = new EventEmitter();

    public exportedPreismeldungen$: Observable<number>;
    public preismeldungen$: Observable<P.CompletePreismeldung[]>;

    private subscriptions: Subscription[];
    private loader: Loading;

    constructor(private store: Store<fromRoot.AppState>, private loadingCtrl: LoadingController) {
        this.preismeldungen$ = store.select(fromRoot.getUnexportedPreismeldungen).publishReplay(1).refCount();
        this.exportedPreismeldungen$ = store.select(fromRoot.getExportedPreismeldungen).publishReplay(1).refCount();
        const arePreismeldungenLoaded$ = this.preismeldungen$
            .map(x => !!x && x.length >= 0)
            .publishReplay(1).refCount();

        this.subscriptions = [
            arePreismeldungenLoaded$
                .subscribe(() => this.dismissLoadingScreen()),

            this.startPreismeldungenExport$
                .withLatestFrom(arePreismeldungenLoaded$, (_, loaded) => loaded)
                .filter(loaded => !!loaded)
                .withLatestFrom(this.preismeldungen$, (_, preismeldungen) => preismeldungen)
                .subscribe(preismeldungen => {
                    this.presentLoadingScreen().then(() => {
                        this.store.dispatch({ type: 'EXPORT_PREISMELDUNGEN', payload: preismeldungen } as exporter.Action);
                    });
                }),

            this.exportedPreismeldungen$
                .filter(count => count != null)
                .subscribe(() => this.dismissLoadingScreen())
        ];
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'PREISMELDUNG_LOAD_UNEXPORTED' });
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

        return this.loader.present();
    }

    private dismissLoadingScreen() {
        if (!!this.loader) {
            this.loader.dismiss();
        }
    }
}
