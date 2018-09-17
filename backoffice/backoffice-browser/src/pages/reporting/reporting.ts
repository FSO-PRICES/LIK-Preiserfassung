import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Loading, LoadingController, IonicPage } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

import * as P from 'lik-shared';

import * as fromRoot from '../../reducers';
import { createLoadReportDataAction, ReportTypes } from '../../actions/report';

@IonicPage({
    segment: 'report',
})
@Component({
    selector: 'reporting-page',
    templateUrl: 'reporting.html',
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
            .filter(x => !!x)
            .map(() => this.reportExecuting$.filter(x => !x).take(1))
            .takeUntil(this.onDestroy$)
            .subscribe(x => this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', x));

        this.loadData$
            .takeUntil(this.onDestroy$)
            .subscribe(reportType => this.store.dispatch(createLoadReportDataAction(reportType)));
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}
