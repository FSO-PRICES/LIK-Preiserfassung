import { Component, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';
import { Loading, LoadingController, IonicPage } from 'ionic-angular';
import { Subject } from 'rxjs';

import * as P from '../../common-models';
import * as fromRoot from '../../reducers';

@IonicPage({
    segment: 'cockpit',
})
@Component({
    selector: 'cockpit-page',
    templateUrl: 'cockpit.html',
})
export class CockpitPage {
    public reportExecuting$ = this.store.select(fromRoot.getCockpitIsExecuting);
    public cockpitReportData$ = this.store.select(fromRoot.getCockpitReportData);
    public cockpitSelectedPreiserheber$ = this.store.select(fromRoot.getCockpitSelectedPreiserheber);

    public loadData$ = new EventEmitter();
    public preiserheberSelected$ = new EventEmitter<P.CockpitPreiserheberSummary>();

    private ionViewDidLeave$ = new Subject();

    constructor(private store: Store<fromRoot.AppState>) {
        this.loadData$
            .takeUntil(this.ionViewDidLeave$)
            .subscribe(() => this.store.dispatch({ type: 'LOAD_COCKPIT_DATA' }));
        this.preiserheberSelected$
            .takeUntil(this.ionViewDidLeave$)
            .subscribe(pe => this.store.dispatch({ type: 'COCKPIT_PREISERHEBER_SELECTED', payload: pe }));
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
    }

    public ionViewDidLeave() {
        this.ionViewDidLeave$.next();
    }
}
