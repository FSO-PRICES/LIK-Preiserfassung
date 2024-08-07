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
import { After } from 'v8';

import { AfterViewInit, Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, switchMap, take, takeUntil } from 'rxjs/operators';

import * as P from '@lik-shared';

import { ReportTypes, createLoadReportDataAction } from '../../actions/report';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'reporting-page',
    templateUrl: 'reporting.html',
    styleUrls: ['reporting.scss'],
})
export class ReportingPage implements OnDestroy, AfterViewInit {
    public reportExecuting$ = this.store.select(fromRoot.getReportIsExecuting);
    public monthlyReportData$ = this.store.select(fromRoot.getMonthlyReportData);
    public organisationReportData$ = this.store.select(fromRoot.getOrganisationReportData);
    public pmsProblemeReportData$ = this.store.select(fromRoot.getPmsProblemeReportData);

    public loadData$ = new EventEmitter<ReportTypes>();
    private onDestroy$ = new Subject<void>();

    constructor(
        private store: Store<fromRoot.AppState>,
        private pefDialogService: P.PefDialogService,
        translate: TranslateService,
    ) {
        this.reportExecuting$
            .pipe(
                filter((x) => !!x),
                switchMap(() =>
                    this.pefDialogService.displayLoading(
                        translate.instant('label.standard.wird_bearbeited_bitte_warten'),
                        {
                            requestDismiss$: this.reportExecuting$.pipe(
                                filter((x) => !x),
                                take(1),
                            ),
                        },
                    ),
                ),
                takeUntil(this.onDestroy$),
            )
            .subscribe(() => {});

        this.loadData$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((reportType) => this.store.dispatch(createLoadReportDataAction(reportType)));
    }

    ngAfterViewInit() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}
