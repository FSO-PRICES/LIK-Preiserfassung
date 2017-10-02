import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import * as P from 'lik-shared';

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
    public controllingReportExecuting$ = this.store.select(fromRoot.getControllingReportExecuting);
    public currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldung);
    public warenkorb$ = this.store.select(fromRoot.getWarenkorbState);

    public editPreismeldungId$ = new EventEmitter<string>();

    public updatePreismeldungPreis$ = new EventEmitter<P.PreismeldungPricePayload>();
    public updatePreismeldungMessages$ = new EventEmitter<P.PreismeldungMessagesPayload>();
    public updatePreismeldungAttributes$ = new EventEmitter<string[]>();
    public savePreismeldungPrice$ = new EventEmitter<P.SavePreismeldungPriceSaveAction>();
    public savePreismeldungMessages$ = new EventEmitter();
    public savePreismeldungAttributes$ = new EventEmitter();
    public closeClicked$ = new EventEmitter();

    private onDestroy$ = new EventEmitter();

    constructor(private store: Store<fromRoot.AppState>, private pefDialogService: P.PefDialogService) {
        this.stichtageReportExecuting$ = this.runStichtageReport$.mapTo(true)
            .merge(this.runStichtageReport$.flatMap(() => Observable.defer(() => this.stichtagPreismeldungenUpdated$.skip(1).take(1))).mapTo(false))
            .startWith(false)
            .publishReplay(1).refCount();

        this.numStichtagPreismeldungenUpdated$ = this.runStichtageReport$
            .merge(this.runStichtageReport$.flatMap(() => Observable.defer(() => this.stichtagPreismeldungenUpdated$.skip(1).take(1).map(x => x.length))))
            .startWith(null)
            .publishReplay(1).refCount();

        this.stichtageReportExecuting$.filter(x => !!x).map(() => this.stichtageReportExecuting$.filter(x => !x).take(1))
            .merge(this.controllingReportExecuting$.filter(x => !!x).map(() => this.controllingReportExecuting$.filter(x => !x).take(1)))
            .takeUntil(this.onDestroy$)
            .subscribe(x => this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', x))

        this.runStichtageReport$
            .takeUntil(this.onDestroy$)
            .subscribe(() => this.store.dispatch(controlling.createUpdateStichtageAction()));

        this.runControllingReport$
            .takeUntil(this.onDestroy$)
            .subscribe(v => this.store.dispatch(controlling.createRunControllingAction(v)));

        this.editPreismeldungId$
            .takeUntil(this.onDestroy$)
            .subscribe(v => this.store.dispatch(controlling.createSelectControllingPmAction(v)));

        this.updatePreismeldungPreis$
            .takeUntil(this.onDestroy$)
            .subscribe(payload => this.store.dispatch({ type: 'UPDATE_PREISMELDUNG_PRICE', payload }));

        this.updatePreismeldungMessages$
            .takeUntil(this.onDestroy$)
            .subscribe(payload => this.store.dispatch({ type: 'UPDATE_PREISMELDUNG_MESSAGES', payload }));

        this.updatePreismeldungAttributes$
            .takeUntil(this.onDestroy$)
            .subscribe(payload => this.store.dispatch({ type: 'UPDATE_PREISMELDUNG_ATTRIBUTES', payload }));

        this.savePreismeldungPrice$
            .takeUntil(this.onDestroy$)
            .subscribe(payload => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_PRICE', payload }));

        this.savePreismeldungMessages$
            .takeUntil(this.onDestroy$)
            .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_MESSAGES' }));

        this.savePreismeldungAttributes$
            .takeUntil(this.onDestroy$)
            .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_ATTRIBUTES' }));

        this.closeClicked$
            .takeUntil(this.onDestroy$)
            .subscribe(() => this.store.dispatch(controlling.createSelectControllingPmAction(null)));
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'RUN_PRE-CONTROLLING_TASKS' });
        this.store.dispatch(controlling.createClearControllingAction());
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}
