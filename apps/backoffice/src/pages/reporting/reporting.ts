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

import * as P from '@lik-shared';

import { filter, switchMap, take, takeUntil } from 'rxjs/operators';
import { createLoadReportDataAction, ReportTypes } from '../../actions/report';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'reporting-page',
    templateUrl: 'reporting.html',
    styleUrls: ['reporting.scss'],
})
export class ReportingPage implements OnDestroy {
    public reportExecuting$ = this.store.select(fromRoot.getReportIsExecuting);
    public monthlyReportData$ = this.store.select(fromRoot.getMonthlyReportData);
    public organisationReportData$ = this.store.select(fromRoot.getOrganisationReportData);
    public pmsProblemeReportData$ = this.store.select(fromRoot.getPmsProblemeReportData);

    public loadData$ = new EventEmitter<ReportTypes>();
    private onDestroy$ = new EventEmitter();

    constructor(private store: Store<fromRoot.AppState>, private pefDialogService: P.PefDialogService) {
        this.reportExecuting$
            .pipe(
                filter(x => !!x),
                switchMap(() =>
                    this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', {
                        requestDismiss$: this.reportExecuting$.pipe(
                            filter(x => !x),
                            take(1),
                        ),
                    }),
                ),
                takeUntil(this.onDestroy$),
            )
            .subscribe(() => {});

        this.loadData$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(reportType => this.store.dispatch(createLoadReportDataAction(reportType)));
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}
