import { Component, OnDestroy, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription, Observable } from 'rxjs';
import { orderBy } from 'lodash';
import * as moment from 'moment';

import { PefDialogService, DialogCancelEditComponent, PreismeldungAction } from 'lik-shared';
import * as P from '../../common-models';

import * as fromRoot from '../../reducers';
import * as preismeldestelle from '../../actions/preismeldestelle';

import { IonicPage } from 'ionic-angular';

@IonicPage({
    segment: 'pm'
})
@Component({
    selector: 'preismeldung',
    templateUrl: 'preismeldung.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldungPage implements OnDestroy {
    public preismeldungen$ = this.store.select(fromRoot.getPreismeldungen)
        .map(preismeldungen => orderBy(preismeldungen, [pm => moment(new Date(pm.preismeldung.modifiedAt)).startOf('second'), pm => +pm.preismeldung.epNummer, pm => pm.preismeldung.laufnummer], ['desc', 'asc', 'asc']));
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);
    public warenkorb$ = this.store.select(fromRoot.getWarenkorbState);
    public status$ = this.store.select(fromRoot.getPreismeldungenStatus);
    public currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldung).publishReplay(1).refCount();

    public updatePreismeldungPreis$ = new EventEmitter<P.PreismeldungPricePayload>();
    public selectPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    public updatePreismeldungAttributes$ = new EventEmitter<string[]>();
    public updatePreismeldungMessages$ = new EventEmitter<P.PreismeldungMessagesPayload>();

    public selectPreismeldestelleNummer$ = new EventEmitter<string>();

    public preismeldestelle$ = this.store.select(fromRoot.getPreismeldungenCurrentPmsNummer)
        .withLatestFrom(this.store.select(fromRoot.getPreismeldestelleState), (pmsNummer, state) => state.entities[`pms/${pmsNummer}`])
        .publishReplay(1).refCount();
    public requestPreismeldungSave$: Observable<P.SavePreismeldungPriceSaveAction>;

    public duplicatePreismeldung$ = new EventEmitter();
    public requestSelectNextPreismeldung$ = new EventEmitter();
    public requestThrowChanges$ = new EventEmitter();
    public save$ = new EventEmitter<P.SavePreismeldungPriceSaveAction>();
    public toolbarButtonClicked$ = new EventEmitter<string>();
    public requestPreismeldungQuickEqual$: Observable<{}>;

    public selectTab$ = new EventEmitter<string>();
    public selectedTab$: Observable<string>;

    private subscriptions: Subscription[] = [];

    constructor(private store: Store<fromRoot.AppState>, private pefDialogService: PefDialogService) {
        const cancelEditDialog$ = Observable.defer(() => pefDialogService.displayDialog(DialogCancelEditComponent, {}).map(x => x.data));

        this.selectedTab$ = this.selectTab$
            .merge(this.save$.filter(x => x.type === 'NO_SAVE_NAVIGATE' || x.type === 'SAVE_AND_NAVIGATE_TAB').map((x: P.SavePreismeldungPriceSaveActionNoSaveNavigate | P.SavePreismeldungPriceSaveActionSaveNavigateTab) => x.tabName))
            .startWith('PREISMELDUNG')
            .publishReplay(1).refCount();

        const tabPair$ = this.selectedTab$
            .scan((agg, v) => ({ from: agg.to, to: v }), { from: null, to: null })
            .publishReplay(1).refCount();

        const createTabLeaveObservable = (tabName: string) =>
            tabPair$
                .filter(x => x.from === tabName)
                .merge(this.selectPreismeldung$.merge(this.selectPreismeldestelleNummer$).withLatestFrom(tabPair$, (_, tabPair) => tabPair).filter(x => x.to === tabName));

        this.requestPreismeldungQuickEqual$ = this.toolbarButtonClicked$
            .filter(x => x === 'PREISMELDUNG_QUICK_EQUAL')
            .map(() => new Date());

        this.subscriptions.push(
            this.updatePreismeldungPreis$
                .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_PRICE', payload }))
        );

        this.subscriptions.push(
            this.selectPreismeldestelleNummer$
                .delay(200)
                .subscribe(pmsNummer => {
                    this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: pmsNummer } as PreismeldungAction)
                })
        );

        const requestSelectPreismeldung$ = this.selectPreismeldung$
            .withLatestFrom(this.currentPreismeldung$.startWith(null), (selectedPreismeldung: P.PreismeldungBag, currentPreismeldung: P.CurrentPreismeldungBag) => ({
                selectedPreismeldung,
                currentPreismeldung,
                isCurrentModified: !!currentPreismeldung && (currentPreismeldung.isModified || currentPreismeldung.isNew)
            }));

        this.subscriptions.push(
            requestSelectPreismeldung$
                .filter(x => !x.isCurrentModified)
                .delay(100)
                .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: x.selectedPreismeldung ? x.selectedPreismeldung.pmId : null }))
        );

        const cancelEditReponse$ = requestSelectPreismeldung$
            .filter(x => x.isCurrentModified)
            .flatMap(x => cancelEditDialog$.map(y => ({ selectedPreismeldung: x.selectedPreismeldung, dialogCode: y })))
            .publishReplay(1).refCount();

        this.requestPreismeldungSave$ = cancelEditReponse$.filter(x => x.dialogCode === 'SAVE').map(() => ({ type: 'SAVE_AND_MOVE_TO_NEXT' }));

        this.subscriptions.push(
            cancelEditReponse$
                .filter(x => x.dialogCode === 'THROW_CHANGES')
                .delay(100)
                .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: x.selectedPreismeldung.pmId }))
        );

        this.subscriptions.push(
            this.save$
                .filter(x => x.type !== 'NO_SAVE_NAVIGATE')
                .subscribe(payload => setTimeout(() => store.dispatch({ type: 'SAVE_PREISMELDUNG_PRICE', payload })))
        );

        this.subscriptions.push(
            createTabLeaveObservable('PRODUCT_ATTRIBUTES')
                .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung)
                .filter(currentPreismeldung => !!currentPreismeldung && !currentPreismeldung.isNew && currentPreismeldung.isAttributesModified)
                .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDING_ATTRIBUTES' }))
        );

        this.subscriptions.push(
            createTabLeaveObservable('MESSAGES')
                .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung)
                .filter(currentPreismeldung => !!currentPreismeldung && !currentPreismeldung.isNew && currentPreismeldung.isMessagesModified)
                .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDING_MESSAGES' }))
        );

        this.subscriptions.push(
            this.updatePreismeldungAttributes$
                .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_ATTRIBUTES', payload }))
        );

        this.subscriptions.push(
            this.updatePreismeldungMessages$
                .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_MESSAGES', payload }))
        );
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' } as preismeldestelle.Action);
    }

    public ngOnDestroy() {
        this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null } as PreismeldungAction);
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}
