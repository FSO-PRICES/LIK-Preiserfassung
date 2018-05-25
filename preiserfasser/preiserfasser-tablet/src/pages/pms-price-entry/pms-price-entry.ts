import { Component, EventEmitter, ChangeDetectionStrategy, NgZone, OnDestroy } from '@angular/core';
import { NavParams, NavController, IonicPage } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { Store } from '@ngrx/store';

import * as P from '../../common-models';
import {
    PefDialogService,
    PefMessageDialogService,
    DialogCancelEditComponent,
    SavePreismeldungPriceSaveActionSaveNavigateTab,
    priceCountIdByPm,
} from 'lik-shared';

import * as fromRoot from '../../reducers';

@IonicPage({
    segment: 'pms-price-entry/:pmsNummer',
})
@Component({
    selector: 'pms-price-entry',
    templateUrl: 'pms-price-entry.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PmsPriceEntryPage implements OnDestroy {
    isDesktop$ = this.store
        .select(fromRoot.getIsDesktop)
        .publishReplay(1)
        .refCount();
    preismeldestelle$ = this.store
        .select(fromRoot.getCurrentPreismeldestelle)
        .publishReplay(1)
        .refCount();
    preismeldungenCurrentPmsNummer$ = this.store
        .select(fromRoot.getPreismeldungenCurrentPmsNummer)
        .publishReplay(1)
        .refCount();
    preismeldungen$ = this.store
        .select(fromRoot.getPreismeldungen)
        .publishReplay(1)
        .refCount();
    currentPreismeldung$ = this.store
        .select(fromRoot.getCurrentPreismeldungViewBag)
        .publishReplay(1)
        .refCount();
    currentLanguage$ = this.store
        .select(fromRoot.getCurrentLanguage)
        .publishReplay(1)
        .refCount();
    currentTime$ = this.store
        .select(fromRoot.getCurrentTime)
        .publishReplay(1)
        .refCount();
    priceCountStatuses$ = this.store.select(fromRoot.getPriceCountStatuses);
    warenkorb$ = this.store.select(fromRoot.getWarenkorb);
    currentPriceCountStatus$ = this.currentPreismeldung$.combineLatest(
        this.priceCountStatuses$,
        (currentPreismeldung, priceCountStatuses) =>
            !currentPreismeldung ? null : priceCountStatuses[priceCountIdByPm(currentPreismeldung.preismeldung)]
    );

    selectPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    save$ = new EventEmitter<P.SavePreismeldungPriceSaveAction>();
    updatePreismeldungPreis$ = new EventEmitter<P.PreismeldungPricePayload>();
    updatePreismeldungMessages$ = new EventEmitter<P.PreismeldungMessagesPayload>();
    updatePreismeldungAttributes$ = new EventEmitter<string[]>();
    duplicatePreismeldung$ = new EventEmitter();
    addNewPreisreihe$ = new EventEmitter();
    navigateToPmsSort$ = new EventEmitter();
    ionViewDidLoad$ = new EventEmitter();
    resetPreismeldung$ = new EventEmitter();
    requestSelectNextPreismeldung$ = new EventEmitter<{}>();
    selectNextPreismeldungRequested$: Observable<{}>;
    requestThrowChanges$ = new EventEmitter<{}>();
    isNotSave$ = new EventEmitter<boolean>();
    disableQuickEqual$ = new EventEmitter<boolean>();

    selectTab$ = new EventEmitter<string>();
    toolbarButtonClicked$ = new EventEmitter<string>();

    requestPreismeldungSave$: Observable<P.SavePreismeldungPriceSaveAction>;
    requestPreismeldungQuickEqual$: Observable<{}>;

    selectedTab$: Observable<string>;

    public chooseFromWarenkorbDisplayed$: Observable<boolean>;

    private onDestroy$ = new Subject<void>();

    constructor(
        private navController: NavController,
        private navParams: NavParams,
        private pefDialogService: PefDialogService,
        private pefMessageDialogService: PefMessageDialogService,
        private store: Store<fromRoot.AppState>,
        private zone: NgZone,
        translateService: TranslateService
    ) {
        const cancelEditDialog$ = Observable.defer(() =>
            pefDialogService.displayDialog(DialogCancelEditComponent, {}).map(x => x.data)
        );

        this.selectedTab$ = this.selectTab$
            .merge(
                this.save$
                    .filter(x => x.type === 'NO_SAVE_NAVIGATE' || x.type === 'SAVE_AND_NAVIGATE_TAB')
                    .map((x: P.SavePreismeldungPriceSaveActionNavigate) => x.tabName)
            )
            .startWith('PREISMELDUNG')
            .publishReplay(1)
            .refCount();

        const requestNavigateHome$ = this.toolbarButtonClicked$
            .filter(x => x === 'HOME')
            .withLatestFrom(this.currentPreismeldung$.startWith(null), (_, currentPreismeldung) => currentPreismeldung)
            .flatMap(currentPreismeldung => {
                if (
                    !currentPreismeldung ||
                    (!!currentPreismeldung && !currentPreismeldung.isModified && !currentPreismeldung.isNew)
                ) {
                    return Observable.of('THROW_CHANGES');
                }
                return cancelEditDialog$;
            })
            .publishReplay(1)
            .refCount();

        const tabPair$ = this.selectedTab$
            .scan((agg, v) => ({ from: agg.to, to: v }), { from: null, to: null })
            .publishReplay(1)
            .refCount();

        const createTabLeaveObservable = (tabName: string) =>
            tabPair$
                .filter(x => x.from === tabName)
                .merge(
                    this.toolbarButtonClicked$
                        .filter(x => x === 'HOME')
                        .withLatestFrom(tabPair$, (_, tabPair) => tabPair)
                        .filter(x => x.to === tabName)
                )
                .merge(
                    this.selectPreismeldung$
                        .withLatestFrom(tabPair$, (_, tabPair) => tabPair)
                        .filter(x => x.to === tabName)
                );

        this.currentTime$.takeUntil(this.onDestroy$).subscribe();

        createTabLeaveObservable('MESSAGES')
            .delay(50)
            .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung)
            .filter(currentPreismeldung => !currentPreismeldung.isNew && currentPreismeldung.isMessagesModified)
            .takeUntil(this.onDestroy$)
            .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_MESSAGES' }));

        createTabLeaveObservable('PRODUCT_ATTRIBUTES')
            .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung)
            .filter(currentPreismeldung => !currentPreismeldung.isNew && currentPreismeldung.isAttributesModified)
            .takeUntil(this.onDestroy$)
            .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDUNG_ATTRIBUTES' }));

        requestNavigateHome$
            .takeUntil(this.onDestroy$)
            .filter(x => x === 'THROW_CHANGES')
            .subscribe(() =>
                this.navigateToDashboard().then(() =>
                    setTimeout(() => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null }), 100)
                )
            );

        this.requestPreismeldungQuickEqual$ = this.toolbarButtonClicked$
            .filter(x => x === 'PREISMELDUNG_QUICK_EQUAL')
            .map(() => new Date());

        this.updatePreismeldungPreis$
            .takeUntil(this.onDestroy$)
            .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_PRICE', payload }));

        this.updatePreismeldungMessages$
            .takeUntil(this.onDestroy$)
            .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_MESSAGES', payload }));

        this.updatePreismeldungAttributes$
            .takeUntil(this.onDestroy$)
            .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_ATTRIBUTES', payload }));

        this.save$
            .takeUntil(this.onDestroy$)
            .filter(x => x.type !== 'NO_SAVE_NAVIGATE')
            // why do I need this setTimeout - is it an Ionic bug? requires two touches on tablet to register 'SAVE_AND_MOVE_TO_NEXT'
            .subscribe(payload => setTimeout(() => store.dispatch({ type: 'SAVE_PREISMELDUNG_PRICE', payload })));

        this.currentPreismeldung$
            .takeUntil(this.onDestroy$)
            .filter(x => !!x && !!x.lastSaveAction && x.lastSaveAction.type === 'SAVE_AND_NAVIGATE_TO_DASHBOARD')
            .flatMap(() =>
                this.navController
                    .setRoot('DashboardPage')
                    .then(() =>
                        setTimeout(() => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null }), 100)
                    )
            )
            .subscribe();

        const dialogNewPmbearbeitungsCode$ = Observable.defer(() =>
            pefDialogService.displayDialog('DialogNewPmBearbeitungsCodeComponent', {}).map(x => x.data)
        );
        const dialogSufficientPreismeldungen$ = Observable.defer(() =>
            pefMessageDialogService.displayDialogYesNo('dialogText_ausreichend-artikel').map(x => x.data)
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
            .takeUntil(this.onDestroy$)
            .filter(x => !x.isCurrentModified)
            .delay(100)
            .subscribe(x =>
                this.store.dispatch({
                    type: 'SELECT_PREISMELDUNG',
                    payload: x.selectedPreismeldung ? x.selectedPreismeldung.pmId : null,
                })
            );

        this.requestThrowChanges$
            .takeUntil(this.onDestroy$)
            .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung)
            .delay(100)
            .subscribe(currentPreismeldung =>
                this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: currentPreismeldung.pmId })
            );

        this.resetPreismeldung$
            .takeUntil(this.onDestroy$)
            .subscribe(() => this.store.dispatch({ type: 'RESET_PREISMELDUNG' }));

        const cancelEditReponse$ = requestSelectPreismeldung$
            .filter(x => x.isCurrentModified)
            .flatMap(x => cancelEditDialog$.map(y => ({ selectedPreismeldung: x.selectedPreismeldung, dialogCode: y })))
            .publishReplay(1)
            .refCount();

        cancelEditReponse$
            .takeUntil(this.onDestroy$)
            .filter(x => x.dialogCode === 'THROW_CHANGES')
            .delay(100)
            .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: x.selectedPreismeldung.pmId }));

        this.requestPreismeldungSave$ = this.toolbarButtonClicked$
            .filter(x => x === 'PREISMELDUNG_SAVE')
            .map(() => ({ type: 'SAVE_AND_MOVE_TO_NEXT' }))
            .merge(
                cancelEditReponse$.filter(x => x.dialogCode === 'SAVE').map(() => ({ type: 'SAVE_AND_MOVE_TO_NEXT' }))
            )
            .merge(
                requestNavigateHome$.filter(x => x === 'SAVE').map(() => ({ type: 'SAVE_AND_NAVIGATE_TO_DASHBOARD' }))
            );

        const duplicatePreismeldung$ = this.duplicatePreismeldung$
            .withLatestFrom(
                this.currentPreismeldung$,
                this.priceCountStatuses$,
                (_, currentPreismeldung: P.PreismeldungBag, priceCountStatuses: P.PriceCountStatusMap) => ({
                    priceCountStatus: priceCountStatuses[priceCountIdByPm(currentPreismeldung.preismeldung)],
                    currentPreismeldung,
                })
            )
            .flatMap(
                ({ priceCountStatus, currentPreismeldung }) =>
                    priceCountStatus.enough
                        ? dialogSufficientPreismeldungen$.map((response: string) => ({ response, currentPreismeldung }))
                        : Observable.of({ response: 'YES', currentPreismeldung })
            )
            .filter(x => x.response === 'YES')
            .map(({ currentPreismeldung }) => ({ source: 'FROM_BUTTON', currentPreismeldung }))
            .merge(
                this.save$
                    .filter(x => x.type === 'SAVE_AND_DUPLICATE_PREISMELDUNG')
                    .withLatestFrom(this.currentPreismeldung$)
                    .map(([_, currentPreismeldung]) => ({ source: 'FROM_CODE_0', currentPreismeldung }))
            )
            .flatMap(({ source, currentPreismeldung }) =>
                dialogNewPmbearbeitungsCode$.map(({ action, bearbeitungscode }) => ({
                    action,
                    source,
                    bearbeitungscode,
                    currentPreismeldung,
                }))
            )
            .publishReplay(1)
            .refCount();

        duplicatePreismeldung$
            .takeUntil(this.onDestroy$)
            .filter(x => x.action === 'OK')
            .subscribe(({ bearbeitungscode, currentPreismeldung }) =>
                this.store.dispatch({
                    type: 'DUPLICATE_PREISMELDUNG',
                    payload: { bearbeitungscode, preismeldungToDuplicate: currentPreismeldung },
                })
            );

        duplicatePreismeldung$
            .takeUntil(this.onDestroy$)
            .filter(x => x.action !== 'OK' && x.source === 'FROM_CODE_0')
            .subscribe(x =>
                this.store.dispatch({
                    type: 'SAVE_PREISMELDUNG_PRICE',
                    payload: {
                        type: 'JUST_SAVE',
                        saveWithData: [{ type: 'COMMENT', comments: ['kommentar-autotext_keine-produkte'] }],
                    },
                })
            );

        this.addNewPreisreihe$.takeUntil(this.onDestroy$).subscribe(() => this.navigateToNewPriceSeries());

        this.navigateToPmsSort$.takeUntil(this.onDestroy$).subscribe(() => this.navigateToPmsSort());

        this.ionViewDidLoad$
            .take(1)
            .withLatestFrom(
                this.preismeldungenCurrentPmsNummer$,
                (_, preismeldungenCurrentPmsNummer) => preismeldungenCurrentPmsNummer
            )
            .filter(x => x !== this.navParams.get('pmsNummer') || !!this.navParams.get('reload'))
            .subscribe(() => {
                this.store.dispatch({ type: 'PREISMELDUNGEN_RESET' });
                this.store.dispatch({
                    type: 'PREISMELDUNGEN_LOAD_FOR_PMS',
                    payload: this.navParams.get('pmsNummer'),
                });
            });

        this.selectNextPreismeldungRequested$ = this.toolbarButtonClicked$
            .filter(x => x === 'REQUEST_SELECT_NEXT_PREISMELDUNG')
            .map(() => ({}))
            .merge(this.requestSelectNextPreismeldung$)
            .publishReplay(1)
            .refCount();
    }

    ionViewDidLoad() {
        this.ionViewDidLoad$.emit();
    }

    navigateToDashboard() {
        return this.navController.setRoot('DashboardPage');
    }

    navigateToPmsSort() {
        return this.navController.setRoot('PmsSortPage', { pmsNummer: this.navParams.get('pmsNummer') });
    }

    navigateToNewPriceSeries() {
        return this.navController.setRoot('NewPriceSeriesPage', { pmsNummer: this.navParams.get('pmsNummer') });
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}
