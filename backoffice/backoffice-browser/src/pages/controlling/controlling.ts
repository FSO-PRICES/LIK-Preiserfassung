import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import { PefDialogService } from 'lik-shared';

import * as controlling from '../../actions/controlling';
import * as fromRoot from '../../reducers';
import { IonicPage } from 'ionic-angular';

@IonicPage({
    segment: 'controlling'
})
@Component({
    selector: 'controlling-page',
    templateUrl: 'controlling.html'
})
export class ControllingPage implements OnDestroy {
    public runStichtageReport$ = new EventEmitter();
    public stichtageReportExecuting$: Observable<boolean>;
    public stichtagPreismeldungenUpdated$ = this.store.select(fromRoot.getStichtagPreismeldungenUpdated);
    public numStichtagPreismeldungenUpdated$: Observable<number>;

    public runControllingReport$ = new EventEmitter<controlling.CONTROLLING_TYPE>();
    public controllingReportData$ = this.store.select(fromRoot.getControllingReportData);
    public getControllingReportExecuting$ = this.store.select(fromRoot.getControllingReportExecuting);

    private onDestroy$ = new EventEmitter();

    constructor(private store: Store<fromRoot.AppState>, private pefDialogService: PefDialogService) {
        this.stichtageReportExecuting$ = this.runStichtageReport$.mapTo(true)
            .merge(this.runStichtageReport$.flatMap(() => Observable.defer(() => this.stichtagPreismeldungenUpdated$.skip(1).take(1))).mapTo(false))
            .startWith(false)
            .publishReplay(1).refCount();

        this.numStichtagPreismeldungenUpdated$ = this.runStichtageReport$
            .merge(this.runStichtageReport$.flatMap(() => Observable.defer(() => this.stichtagPreismeldungenUpdated$.skip(1).take(1).map(x => x.length))))
            .startWith(null)
            .publishReplay(1).refCount();

        this.stichtageReportExecuting$.filter(x => !!x).map(() => this.stichtageReportExecuting$.filter(x => !x).take(1))
            .merge(this.getControllingReportExecuting$.filter(x => !!x).map(() => this.getControllingReportExecuting$.filter(x => !x).take(1)))
            .takeUntil(this.onDestroy$)
            .subscribe(x => this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', x))

        this.runStichtageReport$
            .takeUntil(this.onDestroy$)
            .subscribe(() => this.store.dispatch(controlling.createUpdateStichtageAction()));

        this.runControllingReport$
            .takeUntil(this.onDestroy$)
            .subscribe(v => this.store.dispatch(controlling.createRunControllingAction(v)));
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'RUN_PRE-CONTROLLING_TASKS' });
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}
