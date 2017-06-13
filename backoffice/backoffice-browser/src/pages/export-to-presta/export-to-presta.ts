import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import { PefDialogService } from 'lik-shared';

import * as exporter from '../../actions/exporter';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'export-to-presta',
    templateUrl: 'export-to-presta.html'
})
export class ExportToPrestaPage implements OnDestroy {
    public settings$ = this.store.select(fromRoot.getSettings).publishReplay(1).refCount();

    public exportedPreismeldestellen$ = this.store.select(fromRoot.getExportedPreismeldestellen);
    public exportedPreismeldungen$ = this.store.select(fromRoot.getExportedPreismeldungen);
    public exportedPreiserheber$ = this.store.select(fromRoot.getExportedPreiserheber);

    public exportPreismeldungenClicked$ = new EventEmitter();
    public exportPreismeldestellenClicked$ = new EventEmitter();
    public exportPreiserheberClicked$ = new EventEmitter();

    public isErhebungsorgannummerSet$: Observable<boolean>;

    private subscriptions: Subscription[];

    constructor(private store: Store<fromRoot.AppState>, private pefDialogService: PefDialogService) {
        this.isErhebungsorgannummerSet$ = this.settings$
            .map(settings => !!settings && !!settings.general && !!settings.general.erhebungsorgannummer)
            .distinctUntilChanged();

        this.subscriptions = [
            // Skip is being used to skip initial/previous store value and to wait for a new one
            this.exportPreismeldestellenClicked$
                .flatMap(() => this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', this.exportedPreismeldestellen$.skip(1).take(1)))
                .subscribe(() => this.store.dispatch({ type: 'EXPORT_PREISMELDESTELLEN' } as exporter.Action)),

            this.exportPreismeldungenClicked$
                .flatMap(() => this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', this.exportedPreismeldungen$.skip(1).take(1)))
                .subscribe(() => this.store.dispatch({ type: 'EXPORT_PREISMELDUNGEN' } as exporter.Action)),

            this.exportPreiserheberClicked$
                .flatMap(() => this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', this.exportedPreiserheber$.skip(1).take(1)))
                .withLatestFrom(this.settings$, (_, settings) => settings.general.erhebungsorgannummer)
                .subscribe(erhebungsorgannummer => this.store.dispatch({ type: 'EXPORT_PREISERHEBER', payload: erhebungsorgannummer } as exporter.Action))
        ];
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
    }

    public ngOnDestroy() {
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }
}
