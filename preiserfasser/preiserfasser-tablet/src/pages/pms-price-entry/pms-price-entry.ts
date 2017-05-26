import { Component, EventEmitter, ChangeDetectionStrategy, NgZone, OnDestroy } from '@angular/core';
import { TranslateService } from 'ng2-translate';
import { NavParams, NavController } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';
import { Store } from '@ngrx/store';

import * as P from '../../common-models';
import { PefDialogService, PefDialogYesNoComponent } from 'lik-shared';
import { DashboardPage } from '../dashboard/dashboard';

import * as fromRoot from '../../reducers';

import { DialogCancelEditComponent } from './components/dialog-cancel-edit/dialog-cancel-edit';
import { DialogNewPmBearbeitungsCodeComponent } from '../../common/components/dialog-new-pm-bearbeitungs-code/dialog-new-pm-bearbeitungs-code';
import { NewPriceSeriesPage } from '../new-price-series';

@Component({
    selector: 'pms-price-entry',
    templateUrl: 'pms-price-entry.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PmsPriceEntryPage implements OnDestroy {
    isDesktop$ = this.store.select(fromRoot.getIsDesktop).publishReplay(1).refCount();
    preismeldestelle$ = this.store.select(fromRoot.getCurrentPreismeldestelle).publishReplay(1).refCount();
    preismeldungenCurrentPmsNummer$ = this.store.select(fromRoot.getPreismeldungenCurrentPmsNummer).publishReplay(1).refCount();
    preismeldungen$ = this.store.select(fromRoot.getPreismeldungen).publishReplay(1).refCount();
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldung).publishReplay(1).refCount();
    currentLanguage$ = this.store.select(fromRoot.getCurrentLanguage).publishReplay(1).refCount();
    currentTime$ = this.store.select(fromRoot.getCurrentTime).publishReplay(1).refCount();
    priceCountStatuses$ = this.store.select(fromRoot.getPriceCountStatuses);
    warenkorb$ = this.store.select(fromRoot.getWarenkorb);
    currentPriceCountStatus$ = this.currentPreismeldung$.combineLatest(this.priceCountStatuses$, (currentPreismeldung, priceCountStatuses) => !currentPreismeldung ? null : priceCountStatuses[currentPreismeldung.preismeldung.epNummer]);

    selectPreismeldung$ = new EventEmitter<P.Models.Preismeldung>();
    save$ = new EventEmitter<P.SavePreismeldungPriceSaveAction>();
    updatePreismeldungPreis$ = new EventEmitter<P.PreismeldungPricePayload>();
    updatePreismeldungMessages$ = new EventEmitter<P.PreismeldungMessagesPayload>();
    updatePreismeldungAttributes$ = new EventEmitter<string[]>();
    duplicatePreismeldung$ = new EventEmitter();
    addNewPreisreihe$ = new EventEmitter();
    ionViewDidLoad$ = new EventEmitter();
    resetPreismeldung$ = new EventEmitter();

    selectTab$ = new EventEmitter<string>();
    toolbarButtonClicked$ = new EventEmitter<string>();

    requestPreismeldungSave$: Observable<P.SavePreismeldungPriceSaveAction>;
    requestPreismeldungQuickEqual$: Observable<{}>;

    selectedTab$: Observable<string>;

    public chooseFromWarenkorbDisplayed$: Observable<boolean>;

    private subscriptions: Subscription[] = [];

    constructor(
        private navController: NavController,
        private navParams: NavParams,
        private pefDialogService: PefDialogService,
        private store: Store<fromRoot.AppState>,
        private zone: NgZone,
        translateService: TranslateService
    ) {
        const cancelEditDialog$ = Observable.defer(() => pefDialogService.displayDialog(DialogCancelEditComponent, {}).map(x => x.data));

        this.selectedTab$ = this.selectTab$
            .merge(this.save$.filter(x => x.type === 'NO_SAVE_NAVIGATE').map(x => x.data))
            .startWith('PREISMELDUNG')
            .publishReplay(1).refCount();

        const requestNavigateHome$ = this.toolbarButtonClicked$
            .filter(x => x === 'HOME')
            .withLatestFrom(this.currentPreismeldung$.startWith(null), (_, currentPreismeldung) => currentPreismeldung)
            .flatMap(currentPreismeldung => {
                if (!currentPreismeldung || (!!currentPreismeldung && !currentPreismeldung.isModified && !currentPreismeldung.isNew)) {
                    return Observable.of('THROW_CHANGES');
                }
                return cancelEditDialog$;
            })
            .publishReplay(1).refCount();

        const tabPair$ = this.selectedTab$
            .scan((agg, v) => ({ from: agg.to, to: v }), { from: null, to: null })
            .publishReplay(1).refCount();

        const createTabLeaveObservable = (tabName: string) =>
            tabPair$
                .filter(x => x.from === tabName)
                .merge(this.toolbarButtonClicked$.filter(x => x === 'HOME').withLatestFrom(tabPair$, (_, tabPair) => tabPair).filter(x => x.to === tabName))
                .merge(this.selectPreismeldung$.withLatestFrom(tabPair$, (_, tabPair) => tabPair).filter(x => x.to === tabName));

        this.currentTime$.subscribe();

        this.subscriptions.push(
            createTabLeaveObservable('MESSAGES')
                .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung)
                .filter(currentPreismeldung => !currentPreismeldung.isNew && currentPreismeldung.isMessagesModified)
                .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDING_MESSAGES' }))
        );

        this.subscriptions.push(
            createTabLeaveObservable('PRODUCT_ATTRIBUTES')
                .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung)
                .filter(currentPreismeldung => !currentPreismeldung.isNew && currentPreismeldung.isAttributesModified)
                .subscribe(() => this.store.dispatch({ type: 'SAVE_PREISMELDING_ATTRIBUTES' }))
        );

        this.subscriptions.push(
            requestNavigateHome$
                .filter(x => x === 'THROW_CHANGES')
                .subscribe(() => this.navigateToDashboard().then(() => setTimeout(() => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null }), 100)))
        );

        this.requestPreismeldungQuickEqual$ = this.toolbarButtonClicked$
            .filter(x => x === 'PREISMELDUNG_QUICK_EQUAL')
            .map(() => new Date());

        this.subscriptions.push(
            this.updatePreismeldungPreis$
                .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_PRICE', payload }))
        );

        this.subscriptions.push(
            this.updatePreismeldungMessages$
                .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_MESSAGES', payload }))
        );

        this.subscriptions.push(
            this.updatePreismeldungAttributes$
                .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_ATTRIBUTES', payload }))
        );

        this.subscriptions.push(
            this.save$
                .filter(x => x.type !== 'NO_SAVE_NAVIGATE')
                // why do I need this setTimeout - is it an Ionic bug? requires two touches on tablet to register 'SAVE_AND_MOVE_TO_NEXT'
                .subscribe(payload => setTimeout(() => store.dispatch({ type: 'SAVE_PREISMELDUNG_PRICE', payload })))
        );

        this.subscriptions.push(
            this.currentPreismeldung$
                .filter(x => !!x && !!x.lastSave && x.lastSave.type === 'SAVE_AND_NAVIGATE_TO_DASHBOARD')
                .subscribe(() => this.navController.setRoot(DashboardPage).then(() => setTimeout(() => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null }), 100)))
        );

        const dialogNewPmbearbeitungsCode$ = Observable.defer(() => pefDialogService.displayDialog(DialogNewPmBearbeitungsCodeComponent, {}).map(x => x.data));
        const dialogSufficientPreismeldungen$ = Observable.defer(() => pefDialogService.displayDialog(PefDialogYesNoComponent, translateService.instant('dialogText_sufficientPreismeldungen')).map(x => x.data));

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
                .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: x.selectedPreismeldung.pmId }))
        );

        const cancelEditReponse$ = requestSelectPreismeldung$
            .filter(x => x.isCurrentModified)
            .flatMap(x => cancelEditDialog$.map(y => ({ selectedPreismeldung: x.selectedPreismeldung, dialogCode: y })))
            .publishReplay(1).refCount();

        this.subscriptions.push(
            cancelEditReponse$
                .filter(x => x.dialogCode === 'THROW_CHANGES')
                .delay(100)
                .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: x.selectedPreismeldung.pmId }))
        );

        this.requestPreismeldungSave$ = this.toolbarButtonClicked$.filter(x => x === 'PREISMELDUNG_SAVE').map(() => ({ type: 'SAVE_AND_MOVE_TO_NEXT' }))
            .merge(cancelEditReponse$.filter(x => x.dialogCode === 'SAVE').map(() => ({ type: 'SAVE_AND_MOVE_TO_NEXT' })))
            .merge(requestNavigateHome$.filter(x => x === 'SAVE').map(() => ({ type: 'SAVE_AND_NAVIGATE_TO_DASHBOARD' })));

        this.subscriptions.push(
            this.duplicatePreismeldung$
                .withLatestFrom(this.currentPreismeldung$, this.priceCountStatuses$, (_, currentPreismeldung: P.PreismeldungBag, priceCountStatuses: P.PriceCountStatusMap) => priceCountStatuses[currentPreismeldung.preismeldung.epNummer])
                .flatMap(priceCountStatus => priceCountStatus.enough ? dialogSufficientPreismeldungen$ : Observable.of('YES'))
                .filter(x => x === 'YES')
                .merge(this.save$.filter(x => x.type === 'SAVE_AND_DUPLICATE_PREISMELDUNG'))
                .flatMap(() => dialogNewPmbearbeitungsCode$)
                .filter(x => x.action === 'OK')
                .subscribe(x => this.store.dispatch({ type: 'DUPLICATE_PREISMELDUNG', payload: x.bearbeitungscode }))
        );

        this.subscriptions.push(
            this.addNewPreisreihe$
                .subscribe(() => this.navigateToNewPriceSeries())
        );

        this.subscriptions.push(
            this.ionViewDidLoad$
                .withLatestFrom(this.preismeldungenCurrentPmsNummer$, (_, preismeldungenCurrentPmsNummer) => preismeldungenCurrentPmsNummer)
                .filter(x => x !== this.navParams.get('pmsNummer'))
                .subscribe(() => {
                    this.store.dispatch({ type: 'PREISMELDUNGEN_RESET' });
                    this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: this.navParams.get('pmsNummer') });
                })
        );
    }

    ionViewDidLoad() {
        this.ionViewDidLoad$.emit();
    }

    navigateToDashboard() {
        return this.navController.setRoot(DashboardPage);
    }

    navigateToNewPriceSeries() {
        return this.navController.setRoot(NewPriceSeriesPage, { pmsNummer: this.navParams.get('pmsNummer') });
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}
