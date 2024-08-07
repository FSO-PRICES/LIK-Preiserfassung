import { AfterViewInit, Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, of } from 'rxjs';
import {
    distinctUntilChanged,
    filter,
    flatMap,
    map,
    merge,
    mergeWith,
    publishReplay,
    refCount,
    skip,
    startWith,
    withLatestFrom,
} from 'rxjs/operators';

import { PefDialogService } from '@lik-shared';

import * as exporter from '../../actions/exporter';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'export-to-presta',
    templateUrl: 'export-to-presta.html',
    styleUrls: ['export-to-presta.scss'],
})
export class ExportToPrestaPage implements AfterViewInit, OnDestroy {
    public settings$ = this.store.select(fromRoot.getSettings).pipe(publishReplay(1), refCount());

    public exportedPreismeldestellen$ = this.store.select(fromRoot.getExportedPreismeldestellen);
    public exportedPreismeldungen$ = this.store.select(fromRoot.getExportedPreismeldungen);
    public exportedPreiserheber$ = this.store.select(fromRoot.getExportedPreiserheber);
    public allPreismeldungenNumberOfRecordsExported$ = this.store.select(
        fromRoot.getAllPreismeldungenNumberOfRecordsExported,
    );
    public hasWritePermission$ = this.store.select(fromRoot.hasWritePermission);

    public exportErrorPreismeldestellen$ = this.store
        .select(fromRoot.getExporterState)
        .pipe(map((s) => s.preismeldestellenError));
    public exportErrorPreismeldungen$ = this.store
        .select(fromRoot.getExporterState)
        .pipe(map((s) => s.preismeldungenError));
    public exportErrorPreiserheber$ = this.store
        .select(fromRoot.getExporterState)
        .pipe(map((s) => s.preiserheberError));
    public exportErrorAllPreismeldungen$ = this.store
        .select(fromRoot.getExporterState)
        .pipe(map((s) => s.allPreismeldungenExportedError));

    public exportPreismeldungenClicked$ = new EventEmitter();
    public exportAllPreismeldungenClicked$ = new EventEmitter();
    public exportPreismeldestellenClicked$ = new EventEmitter();
    public exportPreiserheberClicked$ = new EventEmitter();

    public debugConfirmedClicked$ = new EventEmitter<Event>();
    public debugConfirmed$: Observable<boolean>;

    public isErhebungsorgannummerSet$: Observable<boolean>;

    private subscriptions: Subscription[] = [];

    constructor(
        private store: Store<fromRoot.AppState>,
        private pefDialogService: PefDialogService,
        translate: TranslateService,
    ) {
        this.isErhebungsorgannummerSet$ = this.settings$.pipe(
            map((settings) => !!settings && !!settings.general && !!settings.general.erhebungsorgannummer),
            distinctUntilChanged(),
        );

        const dismissPreismeldestellenLoading$ = this.exportedPreismeldestellen$.pipe(
            skip(1),
            filter((x) => x !== null),
            merge(
                this.exportErrorPreismeldestellen$.pipe(
                    skip(1),
                    filter((x) => x !== null),
                ),
            ),
        );
        const dismissPreismeldungenLoading$ = this.exportedPreismeldungen$.pipe(
            skip(1),
            filter((x) => x !== null),
            merge(
                this.exportErrorPreismeldungen$.pipe(
                    skip(1),
                    filter((x) => x !== null),
                ),
            ),
        );
        const dismissPreisherberLoading$ = this.exportedPreiserheber$.pipe(
            skip(1),
            filter((x) => x !== null),
            merge(
                this.exportErrorPreiserheber$.pipe(
                    skip(1),
                    filter((x) => x !== null),
                ),
            ),
        );

        const dismissAllPreismeldungenLoading$ = this.allPreismeldungenNumberOfRecordsExported$.pipe(
            skip(1),
            filter((x) => x !== null),
            mergeWith(
                this.exportErrorAllPreismeldungen$.pipe(
                    skip(1),
                    filter((x) => x !== null),
                ),
            ),
        );

        this.debugConfirmed$ = this.debugConfirmedClicked$.pipe(
            map(() => true),
            startWith(false),
        );

        this.subscriptions = [
            // Skip is being used to skip initial/previous store value and to wait for a new one
            this.exportPreismeldestellenClicked$
                .pipe(
                    flatMap(() =>
                        this.pefDialogService.displayLoading(
                            translate.instant('label.standard.wird_bearbeited_bitte_warten'),
                            {
                                requestDismiss$: dismissPreismeldestellenLoading$,
                            },
                        ),
                    ),
                )
                .subscribe(() => this.store.dispatch({ type: 'EXPORT_PREISMELDESTELLEN' } as exporter.Action)),

            this.exportPreismeldungenClicked$
                .pipe(
                    flatMap(() =>
                        this.pefDialogService.displayLoading(
                            translate.instant('label.standard.wird_bearbeited_bitte_warten'),
                            {
                                requestDismiss$: dismissPreismeldungenLoading$,
                            },
                        ),
                    ),
                )
                .subscribe(() => this.store.dispatch({ type: 'EXPORT_PREISMELDUNGEN' } as exporter.Action)),

            this.exportAllPreismeldungenClicked$
                .pipe(
                    flatMap(() =>
                        this.pefDialogService.displayLoading(
                            translate.instant('label.standard.wird_bearbeited_bitte_warten'),
                            {
                                requestDismiss$: dismissAllPreismeldungenLoading$,
                            },
                        ),
                    ),
                )
                .subscribe(() => this.store.dispatch({ type: 'EXPORT_ALL_PREISMELDUNGEN' } as exporter.Action)),

            this.exportPreiserheberClicked$
                .pipe(
                    flatMap(() =>
                        this.pefDialogService.displayLoading(
                            translate.instant('label.standard.wird_bearbeited_bitte_warten'),
                            {
                                requestDismiss$: dismissPreisherberLoading$,
                            },
                        ),
                    ),
                    withLatestFrom(this.settings$, (_, settings) => settings.general.erhebungsorgannummer),
                )
                .subscribe((erhebungsorgannummer) =>
                    this.store.dispatch({
                        type: 'EXPORT_PREISERHEBER',
                        payload: erhebungsorgannummer,
                    } as exporter.Action),
                ),
        ];
    }
    ngAfterViewInit() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
    }

    ngOnDestroy() {
        this.subscriptions.filter((s) => !!s && !s.closed).forEach((s) => s.unsubscribe());
    }
}
