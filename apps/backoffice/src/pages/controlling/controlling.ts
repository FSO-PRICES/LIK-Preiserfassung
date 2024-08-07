/*
 * LIK-Preiserfassung
 * Copyright (C) 2024 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
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
import { AfterViewInit, Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { first } from 'lodash';
import { Observable, Subject } from 'rxjs';
import { filter, flatMap, map, publishReplay, refCount, take, takeUntil, withLatestFrom } from 'rxjs/operators';

import * as P from '@lik-shared';

import * as controlling from '../../actions/controlling';
import * as status from '../../actions/preismeldungen-status';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'controlling-page',
    templateUrl: 'controlling.html',
    styleUrls: ['controlling.scss'],
})
export class ControllingPage implements AfterViewInit, OnDestroy {
    public stichtagPreismeldungenUpdated$ = this.store.select(fromRoot.getStichtagPreismeldungenUpdated);
    public numStichtagPreismeldungenUpdated$: Observable<number>;

    public runControllingReport$ = new EventEmitter<controlling.CONTROLLING_TYPE>();
    public controllingReportData$ = this.store.select(fromRoot.getControllingReportData);
    public controllingReportExecuting$ = this.store.select(fromRoot.getControllingReportExecuting);
    public currentPreismeldung$ = this.store
        .select(fromRoot.getCurrentPreismeldungViewBag)
        .pipe(publishReplay(1), refCount());
    public warenkorb$ = this.store.select(fromRoot.getWarenkorb);
    public preiszuweisungen$ = this.store.select(fromRoot.getPreiszuweisungen);
    public preiserhebers$ = this.store.select(fromRoot.getPreiserhebers);
    public preismeldungenStatus$ = this.store.select(fromRoot.getPreismeldungenStatusMap);
    public hasWritePermission$ = this.store.select(fromRoot.hasWritePermission);

    public editPreismeldungId$ = new EventEmitter<string>();

    public preismeldestelle$ = this.currentPreismeldung$.pipe(
        filter((x) => !!x),
        withLatestFrom(
            this.store.select(fromRoot.getPreismeldestelleState),
            (bag, state) => state.entities[P.preismeldestelleId(bag.preismeldung.pmsNummer)],
        ),
        publishReplay(1),
        refCount(),
    );
    public preiserheber$ = this.currentPreismeldung$.pipe(
        filter((x) => !!x),
        withLatestFrom(this.preiserhebers$, this.preiszuweisungen$),
        map(([pm, preiserhebers, preiszuweisungen]) =>
            first(
                preiserhebers.filter((pe) =>
                    preiszuweisungen
                        .filter((x) =>
                            x.preismeldestellenNummern.some((pmsNummer) => pmsNummer === pm.preismeldung.pmsNummer),
                        )
                        .map((x) => x.preiserheberId)
                        .some((peId) => peId === pe._id),
                ),
            ),
        ),
        publishReplay(1),
        refCount(),
    );

    public updateAllPmStatus$ = new EventEmitter<P.Models.PreismeldungStatusList>();
    public updatePreismeldungPreis$ = new EventEmitter<P.PreismeldungPricePayload>();
    public updatePreismeldungMessages$ = new EventEmitter<P.PreismeldungMessagesPayload>();
    public updatePreismeldungAttributes$ = new EventEmitter<string[]>();
    public savePreismeldungPrice$ = new EventEmitter<P.SavePreismeldungPriceSaveAction>();
    public savePreismeldungMessages$ = new EventEmitter();
    public savePreismeldungAttributes$ = new EventEmitter();
    public clearControlling$ = new EventEmitter();
    public setPreismeldungStatus$ = new EventEmitter<{ pmId: string; status: P.Models.PreismeldungStatus }>();
    public setPreismeldungStatusBuffered$ = new EventEmitter<{ pmId: string; status: P.Models.PreismeldungStatus }>();
    public resetPreismeldung$ = new EventEmitter();
    public kommentarClearClicked$ = new EventEmitter<{}>();
    public closeClicked$ = new EventEmitter();

    private onDestroy$ = new Subject<void>();

    constructor(
        private store: Store<fromRoot.AppState>,
        private pefDialogService: P.PefDialogService,
        translate: TranslateService,
    ) {
        this.controllingReportExecuting$
            .pipe(
                filter((x) => !!x),
                map(() =>
                    this.controllingReportExecuting$.pipe(
                        filter((x) => !x),
                        take(1),
                    ),
                ),
                flatMap((dismiss$) =>
                    this.pefDialogService.displayLoading(
                        translate.instant('label.standard.wird_bearbeited_bitte_warten'),
                        {
                            requestDismiss$: dismiss$,
                        },
                    ),
                ),
                takeUntil(this.onDestroy$),
            )
            .subscribe();

        this.runControllingReport$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((v) => this.store.dispatch(controlling.createRunControllingAction(v)));

        this.editPreismeldungId$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((v) => this.store.dispatch(controlling.createSelectControllingPmAction(v)));

        this.updatePreismeldungPreis$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((payload) => this.store.dispatch({ type: 'UPDATE_PREISMELDUNG_PRICE', payload }));

        this.updatePreismeldungMessages$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((payload) => this.store.dispatch({ type: 'UPDATE_PREISMELDUNG_MESSAGES', payload }));

        this.updatePreismeldungAttributes$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((payload) => this.store.dispatch({ type: 'UPDATE_PREISMELDUNG_ATTRIBUTES', payload }));

        this.savePreismeldungPrice$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((payload) => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_PRICE', payload }));

        this.savePreismeldungMessages$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_MESSAGES' }));

        this.savePreismeldungAttributes$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_ATTRIBUTES' }));

        this.setPreismeldungStatus$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((payload) => this.store.dispatch(status.createSetPreismeldungenStatusAction(payload)));

        this.updateAllPmStatus$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((payload) => this.store.dispatch(status.createSetPreismeldungenStatusBulkAction(payload)));

        this.kommentarClearClicked$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => store.dispatch({ type: 'CLEAR_AUTOTEXTS' } as P.PreismeldungAction));

        this.closeClicked$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => this.store.dispatch(controlling.createSelectControllingPmAction(null)));

        this.resetPreismeldung$
            .pipe(withLatestFrom(this.currentPreismeldung$), takeUntil(this.onDestroy$))
            .subscribe(([, pm]) => {
                this.store.dispatch(status.createRemovePreismeldungStatusAction(pm.pmId));
                this.store.dispatch({ type: 'RESET_PREISMELDUNG' });
            });
    }

    ngAfterViewInit() {
        this.store.dispatch({ type: 'SWITCH_TO_PREISMELDUNG_SLOT', payload: 'controlling' });
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'RUN_PRE-CONTROLLING_TASKS' });
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' });
        this.store.dispatch({ type: 'PREISERHEBER_LOAD' });
        this.store.dispatch({ type: 'PREISZUWEISUNG_LOAD' });
        this.store.dispatch({ type: 'LOAD_PREISMELDUNGEN_STATUS' });
    }

    ngOnDestroy() {
        this.onDestroy$.next();
        this.store.dispatch(status.createApplyPreismeldungenStatusAction());
        this.store.dispatch({ type: 'SWITCH_TO_PREISMELDUNG_SLOT', payload: '__original' });
    }
}
