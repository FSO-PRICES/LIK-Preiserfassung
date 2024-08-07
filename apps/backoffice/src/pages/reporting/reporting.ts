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
