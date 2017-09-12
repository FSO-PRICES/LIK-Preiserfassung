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
    public loadData$ = new EventEmitter();
    public reportExecuting$: Observable<boolean>;

    public stichtagPreismeldungenUpdated$ = this.store.select(fromRoot.getStichtagPreismeldungenUpdated);
    public numStichtagPreismeldungenUpdated$: Observable<number>;

    private subscriptions = [];
    constructor(private store: Store<fromRoot.AppState>, private pefDialogService: PefDialogService) {
        this.reportExecuting$ = this.loadData$.mapTo(true)
            .merge(this.loadData$.flatMap(() => Observable.defer(() => this.stichtagPreismeldungenUpdated$.skip(1).take(1))).mapTo(false))
            .startWith(false)
            .publishReplay(1).refCount();

        this.numStichtagPreismeldungenUpdated$ = this.loadData$
            .merge(this.loadData$.flatMap(() => Observable.defer(() => this.stichtagPreismeldungenUpdated$.skip(1).take(1).map(x => x.length))))
            .startWith(null)
            .publishReplay(1).refCount();

        this.subscriptions.push(
            this.reportExecuting$.filter(x => !!x)
                .subscribe(() => this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', this.reportExecuting$.filter(x => !x).take(1)))
        );

        this.subscriptions.push(this.loadData$.subscribe(() => this.store.dispatch(controlling.createUpdateStichtageAction())));
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'RUN_PRE-CONTROLLING_TASKS' });
    }

    public runControlling(v) {
        this.store.dispatch(controlling.createRunControllingAction(v));
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}
