import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Loading, LoadingController, IonicPage } from 'ionic-angular';

import * as fromRoot from '../../reducers';

@IonicPage({
    segment: 'cockpit'
})
@Component({
    selector: 'cockpit-page',
    templateUrl: 'cockpit.html'
})
export class CockpitPage implements OnDestroy {
    public reportExecuting$ = this.store.select(fromRoot.getCockpitIsExecuting);
    public loadData$ = new EventEmitter();
    public cockpitReportData$ = this.store.select(fromRoot.getCockpitReportData);

    private subscriptions = [];

    constructor(private store: Store<fromRoot.AppState>) {
        this.subscriptions.push(
            this.loadData$.subscribe(() => this.store.dispatch({ type: 'LOAD_COCKPIT_DATA' }))
        );
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}
