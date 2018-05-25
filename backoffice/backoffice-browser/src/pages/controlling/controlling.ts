import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { first } from 'lodash';

import * as P from 'lik-shared';

import * as controlling from '../../actions/controlling';
import * as fromRoot from '../../reducers';
import { IonicPage } from 'ionic-angular';

@IonicPage({
    segment: 'controlling',
})
@Component({
    selector: 'controlling-page',
    templateUrl: 'controlling.html',
})
export class ControllingPage implements OnDestroy {
    public runStichtageReport$ = new EventEmitter();
    public stichtageReportExecuting$: Observable<boolean>;
    public stichtagPreismeldungenUpdated$ = this.store.select(fromRoot.getStichtagPreismeldungenUpdated);
    public numStichtagPreismeldungenUpdated$: Observable<number>;

    public runControllingReport$ = new EventEmitter<controlling.CONTROLLING_TYPE>();
    public controllingReportData$ = this.store.select(fromRoot.getControllingReportData);
    public controllingReportExecuting$ = this.store.select(fromRoot.getControllingReportExecuting);
    public currentPreismeldung$ = this.store
        .select(fromRoot.getCurrentPreismeldungViewBag)
        .publishReplay(1)
        .refCount();
    public warenkorb$ = this.store.select(fromRoot.getWarenkorbState);
    public preiszuweisungen$ = this.store.select(fromRoot.getPreiszuweisungen);
    public preiserhebers$ = this.store.select(fromRoot.getPreiserhebers);
    public preismeldungenStatus$ = this.store.select(fromRoot.getPreismeldungenStatusMap);

    public editPreismeldungId$ = new EventEmitter<string>();

    public preismeldestelle$ = this.currentPreismeldung$
        .filter(x => !!x)
        .withLatestFrom(
            this.store.select(fromRoot.getPreismeldestelleState),
            (bag, state) => state.entities[P.preismeldestelleId(bag.preismeldung.pmsNummer)]
        )
        .publishReplay(1)
        .refCount();
    public preiserheber$ = this.currentPreismeldung$
        .filter(x => !!x)
        .withLatestFrom(this.preiserhebers$, this.preiszuweisungen$)
        .map(([pm, preiserhebers, preiszuweisungen]) =>
            first(
                preiserhebers.filter(pe =>
                    preiszuweisungen
                        .filter(x =>
                            x.preismeldestellenNummern.some(pmsNummer => pmsNummer === pm.preismeldung.pmsNummer)
                        )
                        .map(x => x.preiserheberId)
                        .some(peId => peId === pe._id)
                )
            )
        )
        .publishReplay(1)
        .refCount();

    public completeAllPreismeldungenStatus$ = new EventEmitter<string[]>();
    public updatePreismeldungPreis$ = new EventEmitter<P.PreismeldungPricePayload>();
    public updatePreismeldungMessages$ = new EventEmitter<P.PreismeldungMessagesPayload>();
    public updatePreismeldungAttributes$ = new EventEmitter<string[]>();
    public savePreismeldungPrice$ = new EventEmitter<P.SavePreismeldungPriceSaveAction>();
    public savePreismeldungMessages$ = new EventEmitter();
    public savePreismeldungAttributes$ = new EventEmitter();
    public clearControlling$ = new EventEmitter();
    public setPreismeldungStatus$ = new EventEmitter<{ pmId: string; status: P.Models.PreismeldungStatus }>();
    public setPreismeldungStatusBuffered$ = new EventEmitter<{ pmId: string; status: P.Models.PreismeldungStatus }>();
    public resetPreismeldung$ = new EventEmitter();
    public kommentarClearClicked$ = new EventEmitter<{}>();
    public closeClicked$ = new EventEmitter();

    private onDestroy$ = new EventEmitter();

    constructor(private store: Store<fromRoot.AppState>, private pefDialogService: P.PefDialogService) {
        this.stichtageReportExecuting$ = this.runStichtageReport$
            .mapTo(true)
            .merge(
                this.runStichtageReport$
                    .flatMap(() => Observable.defer(() => this.stichtagPreismeldungenUpdated$.skip(1).take(1)))
                    .mapTo(false)
            )
            .startWith(false)
            .publishReplay(1)
            .refCount();

        this.numStichtagPreismeldungenUpdated$ = this.runStichtageReport$
            .merge(
                this.runStichtageReport$.flatMap(() =>
                    Observable.defer(() =>
                        this.stichtagPreismeldungenUpdated$
                            .skip(1)
                            .take(1)
                            .map(x => x.length)
                    )
                )
            )
            .startWith(null)
            .publishReplay(1)
            .refCount();

        this.stichtageReportExecuting$
            .filter(x => !!x)
            .map(() => this.stichtageReportExecuting$.filter(x => !x).take(1))
            .merge(
                this.controllingReportExecuting$
                    .filter(x => !!x)
                    .map(() => this.controllingReportExecuting$.filter(x => !x).take(1))
            )
            .takeUntil(this.onDestroy$)
            .subscribe(x => this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', x));

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

        this.setPreismeldungStatus$
            .takeUntil(this.onDestroy$)
            .subscribe(payload => this.store.dispatch({ type: 'SET_PREISMELDUNGEN_STATUS', payload }));

        this.completeAllPreismeldungenStatus$.takeUntil(this.onDestroy$).subscribe(pmIds =>
            this.store.dispatch({
                type: 'SET_PREISMELDUNGEN_STATUS_BULK',
                payload: pmIds.map(pmId => ({ pmId, status: P.Models.PreismeldungStatus.geprüft })),
            })
        );

        this.kommentarClearClicked$
            .takeUntil(this.onDestroy$)
            .subscribe(() => store.dispatch({ type: 'CLEAR_AUTOTEXTS' } as P.PreismeldungAction));

        this.closeClicked$
            .takeUntil(this.onDestroy$)
            .subscribe(() => this.store.dispatch(controlling.createSelectControllingPmAction(null)));

        this.resetPreismeldung$
            .takeUntil(this.onDestroy$)
            .subscribe(() => this.store.dispatch({ type: 'RESET_PREISMELDUNG' }));
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'SWITCH_TO_PREISMELDUNG_SLOT', payload: 'controlling' });
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'RUN_PRE-CONTROLLING_TASKS' });
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' });
        this.store.dispatch({ type: 'PREISERHEBER_LOAD' });
        this.store.dispatch({ type: 'PREISZUWEISUNG_LOAD' });
        this.store.dispatch({ type: 'LOAD_PREISMELDUNGEN_STATUS' });
    }

    public ionViewDidLeave() {
        this.store.dispatch({ type: 'SWITCH_TO_PREISMELDUNG_SLOT', payload: '__original' });
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}
