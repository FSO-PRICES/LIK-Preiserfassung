import { Component, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { IonicPage, NavParams } from 'ionic-angular';
import { Observable, Subject } from 'rxjs';
import { orderBy } from 'lodash';
import * as moment from 'moment';

import {
    PefDialogService,
    DialogCancelEditComponent,
    PreismeldungAction,
    preismeldestelleId,
    PreismeldungIdentifierPayload,
} from 'lik-shared';
import * as P from '../../common-models';

import * as fromRoot from '../../reducers';
import * as preismeldestelle from '../../actions/preismeldestelle';

@IonicPage({
    segment: 'pm',
})
@Component({
    selector: 'preismeldung',
    templateUrl: 'preismeldung.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungPage {
    public preismeldungen$ = this.store
        .select(fromRoot.getPreismeldungen)
        .map(preismeldungen =>
            orderBy(
                preismeldungen,
                [
                    pm => moment(new Date(pm.preismeldung.modifiedAt)).startOf('second'),
                    pm => +pm.preismeldung.epNummer,
                    pm => pm.preismeldung.laufnummer,
                ],
                ['desc', 'asc', 'asc']
            )
        );
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);
    public warenkorb$ = this.store.select(fromRoot.getWarenkorbState);
    public status$ = this.store.select(fromRoot.getPreismeldungenStatus);
    public currentPreismeldung$ = this.store
        .select(fromRoot.getCurrentPreismeldungViewBag)
        .publishReplay(1)
        .refCount();

    public updatePreismeldungPreis$ = new EventEmitter<P.PreismeldungPricePayload>();
    public selectPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    public updatePreismeldungAttributes$ = new EventEmitter<string[]>();
    public updatePreismeldungMessages$ = new EventEmitter<P.PreismeldungMessagesPayload>();
    public resetPreismeldung$ = new EventEmitter();

    public selectPreismeldestelleNummer$ = new EventEmitter<string>();
    public globalFilterTextChanged$ = new EventEmitter<PreismeldungIdentifierPayload>();

    public preismeldestelle$ = this.store
        .select(fromRoot.getPreismeldungenCurrentPmsNummer)
        .withLatestFrom(
            this.store.select(fromRoot.getPreismeldestelleState),
            (pmsNummer, state) => state.entities[preismeldestelleId(pmsNummer)]
        )
        .publishReplay(1)
        .refCount();
    public requestPreismeldungSave$: Observable<P.SavePreismeldungPriceSaveAction>;

    public duplicatePreismeldung$ = new EventEmitter();
    public requestSelectNextPreismeldung$ = new EventEmitter();
    public requestThrowChanges$ = new EventEmitter();
    public save$ = new EventEmitter<P.SavePreismeldungPriceSaveAction>();
    public toolbarButtonClicked$ = new EventEmitter<string>();
    public requestPreismeldungQuickEqual$: Observable<{}>;
    public kommentarClearClicked$ = new EventEmitter<{}>();

    public selectTab$ = new EventEmitter<string>();
    public selectedTab$: Observable<string>;
    public initialPmsNummer: string;

    private ionViewDidLeave$ = new Subject();

    constructor(
        private store: Store<fromRoot.AppState>,
        private pefDialogService: PefDialogService,
        private navParams: NavParams
    ) {
        const cancelEditDialog$ = Observable.defer(() =>
            pefDialogService.displayDialog(DialogCancelEditComponent, {}).map(x => x.data)
        );

        this.initialPmsNummer = this.navParams.get('pmsNummer');
        console.log('initial', this.initialPmsNummer);

        this.selectedTab$ = this.selectTab$
            .merge(
                this.save$
                    .filter(x => x.type === 'NO_SAVE_NAVIGATE' || x.type === 'SAVE_AND_NAVIGATE_TAB')
                    .map((x: P.SavePreismeldungPriceSaveActionNavigate) => x.tabName)
            )
            .startWith('PREISMELDUNG')
            .publishReplay(1)
            .refCount();

        const tabPair$ = this.selectedTab$
            .scan((agg, v) => ({ from: agg.to, to: v }), { from: null, to: null })
            .publishReplay(1)
            .refCount();

        const createTabLeaveObservable = (tabName: string) =>
            tabPair$.filter(x => x.from === tabName).merge(
                this.selectPreismeldung$
                    .merge(this.selectPreismeldestelleNummer$)
                    .withLatestFrom(tabPair$, (_, tabPair) => tabPair)
                    .filter(x => x.to === tabName)
            );

        this.requestPreismeldungQuickEqual$ = this.toolbarButtonClicked$
            .filter(x => x === 'PREISMELDUNG_QUICK_EQUAL')
            .map(() => new Date());

        this.updatePreismeldungPreis$
            .takeUntil(this.ionViewDidLeave$)
            .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_PRICE', payload }));

        this.selectPreismeldestelleNummer$
            .merge(this.globalFilterTextChanged$)
            .filter(x => !x)
            .takeUntil(this.ionViewDidLeave$)
            .subscribe(x => {
                this.store.dispatch({ type: 'PREISMELDUNGEN_RESET' });
            });

        this.selectPreismeldestelleNummer$
            .filter(x => !!x)
            .delay(200)
            .takeUntil(this.ionViewDidLeave$)
            .subscribe(pmsNummer => {
                this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: pmsNummer } as PreismeldungAction);
            });

        this.globalFilterTextChanged$
            .filter(x => !!x)
            .takeUntil(this.ionViewDidLeave$)
            .subscribe(x =>
                this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_FOR_ID', payload: x } as PreismeldungAction)
            );

        const requestSelectPreismeldung$ = this.selectPreismeldung$.withLatestFrom(
            this.currentPreismeldung$.startWith(null),
            (selectedPreismeldung: P.PreismeldungBag, currentPreismeldung: P.CurrentPreismeldungBag) => ({
                selectedPreismeldung,
                currentPreismeldung,
                isCurrentModified:
                    !!currentPreismeldung && (currentPreismeldung.isModified || currentPreismeldung.isNew),
            })
        );

        requestSelectPreismeldung$
            .filter(x => !x.isCurrentModified)
            .delay(100)
            .takeUntil(this.ionViewDidLeave$)
            .subscribe(x =>
                this.store.dispatch({
                    type: 'SELECT_PREISMELDUNG',
                    payload: x.selectedPreismeldung ? x.selectedPreismeldung.pmId : null,
                })
            );

        const cancelEditReponse$ = requestSelectPreismeldung$
            .filter(x => x.isCurrentModified)
            .flatMap(x => cancelEditDialog$.map(y => ({ selectedPreismeldung: x.selectedPreismeldung, dialogCode: y })))
            .publishReplay(1)
            .refCount();

        this.requestPreismeldungSave$ = cancelEditReponse$
            .filter(x => x.dialogCode === 'SAVE')
            .map(() => ({ type: 'SAVE_AND_MOVE_TO_NEXT' }));

        cancelEditReponse$
            .filter(x => x.dialogCode === 'THROW_CHANGES')
            .delay(100)
            .takeUntil(this.ionViewDidLeave$)
            .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: x.selectedPreismeldung.pmId }));

        this.kommentarClearClicked$
            .takeUntil(this.ionViewDidLeave$)
            .subscribe(() => store.dispatch({ type: 'CLEAR_AUTOTEXTS' } as PreismeldungAction));

        this.save$
            .filter(x => x.type !== 'NO_SAVE_NAVIGATE')
            .takeUntil(this.ionViewDidLeave$)
            .subscribe(payload => setTimeout(() => store.dispatch({ type: 'SAVE_PREISMELDUNG_PRICE', payload })));

        createTabLeaveObservable('PRODUCT_ATTRIBUTES')
            .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung)
            .filter(
                currentPreismeldung =>
                    !!currentPreismeldung && !currentPreismeldung.isNew && currentPreismeldung.isAttributesModified
            )
            .takeUntil(this.ionViewDidLeave$)
            .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_ATTRIBUTES' }));

        createTabLeaveObservable('MESSAGES')
            .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung)
            .filter(
                currentPreismeldung =>
                    !!currentPreismeldung && !currentPreismeldung.isNew && currentPreismeldung.isMessagesModified
            )
            .takeUntil(this.ionViewDidLeave$)
            .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_MESSAGES' }));

        this.updatePreismeldungAttributes$
            .takeUntil(this.ionViewDidLeave$)
            .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_ATTRIBUTES', payload }));

        this.updatePreismeldungMessages$
            .takeUntil(this.ionViewDidLeave$)
            .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_MESSAGES', payload }));

        this.resetPreismeldung$
            .takeUntil(this.ionViewDidLeave$)
            .subscribe(() => this.store.dispatch({ type: 'RESET_PREISMELDUNG' }));
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' } as preismeldestelle.Action);
    }

    public ionViewDidLeave() {
        this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null } as PreismeldungAction);
        this.store.dispatch({ type: 'PREISMELDUNGEN_RESET' } as PreismeldungAction);
        this.ionViewDidLeave$.next();
    }
}
