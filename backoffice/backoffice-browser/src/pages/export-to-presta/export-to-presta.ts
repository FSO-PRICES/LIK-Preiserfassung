import { Component, EventEmitter, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import { Models as P, PefDialogService } from 'lik-shared';

import * as exporter from '../../actions/exporter';
import * as fromRoot from '../../reducers';
import { AdvancedPreismeldestelle } from '../../../../../lik-shared/common/models';
import { groupBy } from 'lodash';

@Component({
    templateUrl: 'export-to-presta.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportToPrestaPage implements OnDestroy {
    public startPreismeldungenExport$ = new EventEmitter();
    public startPreismeldestellenExport$ = new EventEmitter();
    public startPreiserheberExport$ = new EventEmitter();

    public exportedPreismeldungen$: Observable<number>;
    public exportedPreismeldestellen$: Observable<number>;
    public exportedPreiserheber$: Observable<number>;

    public preismeldungen$: Observable<P.CompletePreismeldung[]>;
    public preismeldestellen$: Observable<P.AdvancedPreismeldestelle[]>;
    public preiserheber$: Observable<P.Erheber[]>;
    public preiszuweisungen$: Observable<P.Preiszuweisung[]>;

    private subscriptions: Subscription[];

    constructor(private store: Store<fromRoot.AppState>, private pefDialogService: PefDialogService) {
        this.preismeldungen$ = store.select(fromRoot.getUnexportedPreismeldungen).publishReplay(1).refCount();
        this.preismeldestellen$ = store.select(fromRoot.getPreismeldestellen).publishReplay(1).refCount();
        this.preiserheber$ = store.select(fromRoot.getPreiserhebers).publishReplay(1).refCount();
        this.preiszuweisungen$ = store.select(fromRoot.getPreiszuweisungen).publishReplay(1).refCount();

        this.exportedPreismeldungen$ = store.select(fromRoot.getExportedPreismeldungen).publishReplay(1).refCount();
        this.exportedPreismeldestellen$ = store.select(fromRoot.getExportedPreismeldestellen).publishReplay(1).refCount();
        this.exportedPreiserheber$ = store.select(fromRoot.getExportedPreiserheber).publishReplay(1).refCount();

        const preismeldungenAreExported$ = this.exportedPreismeldungen$
            .skip(1) // Skip the first value because this is the previous value from store, wait for a new value
            .filter(count => count != null);
        const preismeldestellenAreExported$ = this.exportedPreismeldestellen$
            .skip(1)
            .filter(count => count != null);
        const preiserheberAreExported$ = this.exportedPreiserheber$
            .skip(1)
            .filter(count => count != null);

        this.subscriptions = [
            this.startPreismeldungenExport$
                .flatMap(() => this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', preismeldungenAreExported$))
                .withLatestFrom(this.preismeldungen$, (_, preismeldungen) => preismeldungen)
                .subscribe(preismeldungen => {
                    this.store.dispatch({ type: 'EXPORT_PREISMELDUNGEN', payload: preismeldungen } as exporter.Action);
                }),

            this.startPreismeldestellenExport$
                .flatMap(() => this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', preismeldestellenAreExported$))
                .withLatestFrom(this.preismeldestellen$, (_, preismeldestellen) => preismeldestellen)
                .subscribe(preismeldestellen => {
                    this.store.dispatch({ type: 'EXPORT_PREISMELDESTELLEN', payload: preismeldestellen } as exporter.Action);
                }),

            this.startPreiserheberExport$
                .flatMap(() => this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', preiserheberAreExported$))
                .withLatestFrom(this.preiserheber$, this.preiszuweisungen$, (_, preiserheber, preiszuweisungen) => {
                    const preiserheberMap = groupBy(preiserheber, pe => pe._id);
                    return preiszuweisungen.map(pz => ({ preiserheber: preiserheberMap[pz.preiserheberId][0], pmsNummers: pz.preismeldestellen.map(pms => pms.pmsNummer) }));
                })
                .subscribe(preiserheber => {
                    this.store.dispatch({ type: 'EXPORT_PREISERHEBER', payload: preiserheber } as exporter.Action);
                })
        ];
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'PREISMELDUNG_LOAD_UNEXPORTED' });
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' });
        this.store.dispatch({ type: 'PREISERHEBER_LOAD' });
        this.store.dispatch({ type: 'PREISZUWEISUNG_LOAD' });
    }

    public ngOnDestroy() {
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }
}
