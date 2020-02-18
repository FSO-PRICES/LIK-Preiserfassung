import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { first } from 'lodash';
import { Observable } from 'rxjs';
import { filter, map, publishReplay, refCount, take, takeUntil, withLatestFrom } from 'rxjs/operators';

import * as P from '@lik-shared';

import * as controlling from '../../actions/controlling';
import * as status from '../../actions/preismeldungen-status';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'controlling-page',
    templateUrl: 'controlling.html',
    styleUrls: ['controlling.scss'],
})
export class ControllingPage implements OnDestroy {
    public stichtagPreismeldungenUpdated$ = this.store.select(fromRoot.getStichtagPreismeldungenUpdated);
    public numStichtagPreismeldungenUpdated$: Observable<number>;

    public runControllingReport$ = new EventEmitter<controlling.CONTROLLING_TYPE>();
    public controllingReportData$ = this.store.select(fromRoot.getControllingReportData);
    public controllingReportExecuting$ = this.store.select(fromRoot.getControllingReportExecuting);
    public currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldungViewBag).pipe(
        publishReplay(1),
        refCount(),
    );
    public warenkorb$ = this.store.select(fromRoot.getWarenkorb);
    public preiszuweisungen$ = this.store.select(fromRoot.getPreiszuweisungen);
    public preiserhebers$ = this.store.select(fromRoot.getPreiserhebers);
    public preismeldungenStatus$ = this.store.select(fromRoot.getPreismeldungenStatusMap);

    public editPreismeldungId$ = new EventEmitter<string>();

    public preismeldestelle$ = this.currentPreismeldung$.pipe(
        filter(x => !!x),
        withLatestFrom(
            this.store.select(fromRoot.getPreismeldestelleState),
            (bag, state) => state.entities[P.preismeldestelleId(bag.preismeldung.pmsNummer)],
        ),
        publishReplay(1),
        refCount(),
    );
    public preiserheber$ = this.currentPreismeldung$.pipe(
        filter(x => !!x),
        withLatestFrom(this.preiserhebers$, this.preiszuweisungen$),
        map(([pm, preiserhebers, preiszuweisungen]) =>
            first(
                preiserhebers.filter(pe =>
                    preiszuweisungen
                        .filter(x =>
                            x.preismeldestellenNummern.some(pmsNummer => pmsNummer === pm.preismeldung.pmsNummer),
                        )
                        .map(x => x.preiserheberId)
                        .some(peId => peId === pe._id),
                ),
            ),
        ),
        publishReplay(1),
        refCount(),
    );

    public updateAllPmStatus$ = new EventEmitter<P.Models.PreismeldungStatusList>();
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
        this.controllingReportExecuting$
            .pipe(
                filter(x => !!x),
                map(() =>
                    this.controllingReportExecuting$.pipe(
                        filter(x => !x),
                        take(1),
                    ),
                ),
                takeUntil(this.onDestroy$),
            )
            .subscribe(dismiss$ =>
                this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', {
                    requestDismiss$: dismiss$,
                }),
            );

        this.runControllingReport$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(v => this.store.dispatch(controlling.createRunControllingAction(v)));

        this.editPreismeldungId$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(v => this.store.dispatch(controlling.createSelectControllingPmAction(v)));

        this.updatePreismeldungPreis$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(payload => this.store.dispatch({ type: 'UPDATE_PREISMELDUNG_PRICE', payload }));

        this.updatePreismeldungMessages$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(payload => this.store.dispatch({ type: 'UPDATE_PREISMELDUNG_MESSAGES', payload }));

        this.updatePreismeldungAttributes$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(payload => this.store.dispatch({ type: 'UPDATE_PREISMELDUNG_ATTRIBUTES', payload }));

        this.savePreismeldungPrice$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(payload => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_PRICE', payload }));

        this.savePreismeldungMessages$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_MESSAGES' }));

        this.savePreismeldungAttributes$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_ATTRIBUTES' }));

        this.setPreismeldungStatus$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(payload => this.store.dispatch(status.createSetPreismeldungenStatusAction(payload)));

        this.updateAllPmStatus$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(payload => this.store.dispatch(status.createSetPreismeldungenStatusBulkAction(payload)));

        this.kommentarClearClicked$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => store.dispatch({ type: 'CLEAR_AUTOTEXTS' } as P.PreismeldungAction));

        this.closeClicked$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => this.store.dispatch(controlling.createSelectControllingPmAction(null)));

        this.resetPreismeldung$
            .pipe(takeUntil(this.onDestroy$))
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
        this.store.dispatch(status.createApplyPreismeldungenStatusAction());
        this.store.dispatch({ type: 'SWITCH_TO_PREISMELDUNG_SLOT', payload: '__original' });
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}
