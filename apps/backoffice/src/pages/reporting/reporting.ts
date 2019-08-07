import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';

import * as P from '@lik-shared';

import { filter, map, take, takeUntil } from 'rxjs/operators';
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
                map(() =>
                    this.reportExecuting$.pipe(
                        filter(x => !x),
                        take(1),
                    ),
                ),
                takeUntil(this.onDestroy$),
            )
            .subscribe(x =>
                this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', {
                    requestDismiss$: x,
                }),
            );

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
