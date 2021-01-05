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

import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import {
    distinctUntilChanged,
    filter,
    flatMap,
    map,
    merge,
    publishReplay,
    refCount,
    skip,
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
export class ExportToPrestaPage implements OnDestroy {
    public settings$ = this.store.select(fromRoot.getSettings).pipe(
        publishReplay(1),
        refCount(),
    );

    public exportedPreismeldestellen$ = this.store.select(fromRoot.getExportedPreismeldestellen);
    public exportedPreismeldungen$ = this.store.select(fromRoot.getExportedPreismeldungen);
    public exportedPreiserheber$ = this.store.select(fromRoot.getExportedPreiserheber);

    public exportErrorPreismeldestellen$ = this.store
        .select(fromRoot.getExporterState)
        .pipe(map(s => s.preismeldestellenError));
    public exportErrorPreismeldungen$ = this.store
        .select(fromRoot.getExporterState)
        .pipe(map(s => s.preismeldungenError));
    public exportErrorPreiserheber$ = this.store.select(fromRoot.getExporterState).pipe(map(s => s.preiserheberError));

    public exportPreismeldungenClicked$ = new EventEmitter();
    public exportPreismeldestellenClicked$ = new EventEmitter();
    public exportPreiserheberClicked$ = new EventEmitter();

    public isErhebungsorgannummerSet$: Observable<boolean>;

    private subscriptions: Subscription[] = [];

    constructor(private store: Store<fromRoot.AppState>, private pefDialogService: PefDialogService) {
        this.isErhebungsorgannummerSet$ = this.settings$.pipe(
            map(settings => !!settings && !!settings.general && !!settings.general.erhebungsorgannummer),
            distinctUntilChanged(),
        );

        const dismissPreismeldestellenLoading$ = this.exportedPreismeldestellen$.pipe(
            skip(1),
            filter(x => x !== null),
            merge(
                this.exportErrorPreismeldestellen$.pipe(
                    skip(1),
                    filter(x => x !== null),
                ),
            ),
        );
        const dismissPreismeldungenLoading$ = this.exportedPreismeldungen$.pipe(
            skip(1),
            filter(x => x !== null),
            merge(
                this.exportErrorPreismeldungen$.pipe(
                    skip(1),
                    filter(x => x !== null),
                ),
            ),
        );
        const dismissPreisherberLoading$ = this.exportedPreiserheber$.pipe(
            skip(1),
            filter(x => x !== null),
            merge(
                this.exportErrorPreiserheber$.pipe(
                    skip(1),
                    filter(x => x !== null),
                ),
            ),
        );

        this.subscriptions = [
            // Skip is being used to skip initial/previous store value and to wait for a new one
            this.exportPreismeldestellenClicked$
                .pipe(
                    flatMap(() =>
                        this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', {
                            requestDismiss$: dismissPreismeldestellenLoading$,
                        }),
                    ),
                )
                .subscribe(() => this.store.dispatch({ type: 'EXPORT_PREISMELDESTELLEN' } as exporter.Action)),

            this.exportPreismeldungenClicked$
                .pipe(
                    flatMap(() =>
                        this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', {
                            requestDismiss$: dismissPreismeldungenLoading$,
                        }),
                    ),
                )
                .subscribe(() => this.store.dispatch({ type: 'EXPORT_PREISMELDUNGEN' } as exporter.Action)),

            this.exportPreiserheberClicked$
                .pipe(
                    flatMap(() =>
                        this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', {
                            requestDismiss$: dismissPreisherberLoading$,
                        }),
                    ),
                    withLatestFrom(this.settings$, (_, settings) => settings.general.erhebungsorgannummer),
                )
                .subscribe(erhebungsorgannummer =>
                    this.store.dispatch({
                        type: 'EXPORT_PREISERHEBER',
                        payload: erhebungsorgannummer,
                    } as exporter.Action),
                ),
        ];
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }
}
