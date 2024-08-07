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
import { Subject } from 'rxjs';
import { filter, flatMap, skip, take, takeUntil } from 'rxjs/operators';

import { PefDialogService } from '@lik-shared';

import * as controlling from '../../actions/controlling';
import * as preismeldungenStatusActions from '../../actions/preismeldungen-status';
import * as P from '../../common-models';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'cockpit-page',
    templateUrl: 'cockpit.html',
    styleUrls: ['cockpit.scss'],
})
export class CockpitPage implements AfterViewInit, OnDestroy {
    public reportExecuting$ = this.store.select(fromRoot.getCockpitIsExecuting);
    public cockpitReportData$ = this.store.select(fromRoot.getCockpitReportData);
    public cockpitSelectedPreiserheber$ = this.store.select(fromRoot.getCockpitSelectedPreiserheber);
    public preismeldungenStatusMapMissingCount$ = this.store.select(fromRoot.getPreismeldungenStatusMapMissingCount);
    public preismeldungenStatusMapUpdatedCount$ = this.store.select(fromRoot.getPreismeldungenStatusMapUpdatedCount);
    public initializingPreismeldungenStatus$ = this.store.select(fromRoot.getArePreismeldungenStatusInitializing);
    public hasWritePermission$ = this.store.select(fromRoot.hasWritePermission);

    public loadData$ = new EventEmitter<void>();
    public initPreismeldungenStatus$ = new EventEmitter();
    public preiserheberSelected$ = new EventEmitter<P.CockpitPreiserheberSummary>();
    public checkPreismeldungStatus$ = new EventEmitter();

    private onDestroy$ = new Subject<void>();

    constructor(
        private store: Store<fromRoot.AppState>,
        private pefDialogService: PefDialogService,
        translate: TranslateService,
    ) {
        this.loadData$
            .pipe(
                flatMap(() =>
                    this.pefDialogService.displayLoading(
                        translate.instant('label.standard.wird_bearbeited_bitte_warten'),
                        {
                            requestDismiss$: this.cockpitReportData$.pipe(
                                skip(1),
                                filter((data) => !!data),
                                take(1),
                            ),
                        },
                    ),
                ),
                takeUntil(this.onDestroy$),
            )
            .subscribe(() => {
                this.store.dispatch({ type: 'LOAD_COCKPIT_DATA' });
                this.store.dispatch(preismeldungenStatusActions.createGetMissingPreismeldungenStatusCountAction());
            });
        this.checkPreismeldungStatus$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() =>
                this.store.dispatch(preismeldungenStatusActions.createGetMissingPreismeldungenStatusCountAction()),
            );
        this.preiserheberSelected$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((pe) =>
                this.store.dispatch({ type: 'COCKPIT_PREISERHEBER_SELECTED', payload: pe ? pe.erheber._id : null }),
            );
        this.initPreismeldungenStatus$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
            this.store.dispatch(preismeldungenStatusActions.createInitializePreismeldungenStatusAction());
            this.store.dispatch(controlling.createClearControllingAction());
        });
    }

    ngAfterViewInit() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch(preismeldungenStatusActions.createGetMissingPreismeldungenStatusCountAction());
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}
