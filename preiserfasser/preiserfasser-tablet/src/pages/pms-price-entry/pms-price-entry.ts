import { Component, EventEmitter, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { TranslateService } from 'ng2-translate';
import { NavParams, NavController } from 'ionic-angular';
import { Observable } from 'rxjs';
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
export class PmsPriceEntryPage {
    isDesktop$ = this.store.select(fromRoot.getIsDesktop).publishReplay(1).refCount();
    preismeldestelle$ = this.store.select(fromRoot.getCurrentPreismeldestelle);
    preismeldungen$ = this.store.select(fromRoot.getPreismeldungen).publishReplay(1).refCount();
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldung).publishReplay(1).refCount();
    currentLanguage$ = this.store.select(fromRoot.getCurrentLanguage).publishReplay(1).refCount();
    priceCountStatuses$ = this.store.select(fromRoot.getPriceCountStatuses);
    warenkorb$ = this.store.select(fromRoot.getWarenkorb);
    currentPriceCountStatus$ = this.currentPreismeldung$.combineLatest(this.priceCountStatuses$, (currentPreismeldung, priceCountStatuses) => !currentPreismeldung ? null : priceCountStatuses[currentPreismeldung.preismeldung.epNummer]);

    selectPreismeldung$ = new EventEmitter<P.Models.Preismeldung>();
    save$ = new EventEmitter<{ saveAction: P.SavePreismeldungPricePayloadType }>();
    updatePreismeldungPreis$ = new EventEmitter<P.SavePreismeldungPricePayloadType>();
    duplicatePreismeldung$ = new EventEmitter();
    addNewPreisreihe$ = new EventEmitter();
    ionViewDidLoad$ = new EventEmitter();

    selectTab$ = new EventEmitter<string>();
    toolbarButtonClicked$ = new EventEmitter<string>();

    requestPreismeldungSave$: Observable<{ saveAction: P.SavePreismeldungPricePayloadType}>;
    requestPreismeldungQuickEqual$: Observable<{}>;

    selectedTab$ = this.selectTab$
        .startWith('PREISMELDUNG')
        .publishReplay(1).refCount();

    public chooseFromWarenkorbDisplayed$: Observable<boolean>;

    constructor(
        private navController: NavController,
        private navParams: NavParams,
        private pefDialogService: PefDialogService,
        private store: Store<fromRoot.AppState>,
        private zone: NgZone,
        translateService: TranslateService
    ) {
        const cancelEditDialog$ = Observable.defer(() => pefDialogService.displayDialog(DialogCancelEditComponent, {}).map(x => x.data));

        const requestNavigateHome$ = this.toolbarButtonClicked$
            .filter(x => x === 'HOME')
            .withLatestFrom(this.currentPreismeldung$.startWith(null), (_, currentPreismeldung) => currentPreismeldung)
            .flatMap(currentPreismeldung => {
                if (!currentPreismeldung || (!!currentPreismeldung && !currentPreismeldung.isModified)) {
                    return Observable.of('THROW_CHANGES');
                }
                return cancelEditDialog$;
            })
            .publishReplay(1).refCount();

        requestNavigateHome$
            .filter(x => x === 'THROW_CHANGES')
            .subscribe(() => this.navController.setRoot(DashboardPage).then(() => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null })));

        this.requestPreismeldungQuickEqual$ = this.toolbarButtonClicked$
            .filter(x => x === 'PREISMELDUNG_QUICK_EQUAL')
            .map(() => new Date());

        this.updatePreismeldungPreis$
            .subscribe(x => store.dispatch({ type: 'UPDATE_PREISMELDUNG_PRICE', payload: x }));

        this.save$
            // why do I need this setTimeout - is it an Ionic bug? requires two touches on tablet to register 'SAVE_AND_MOVE_TO_NEXT'
            .subscribe(x => setTimeout(() => store.dispatch({ type: 'SAVE_PREISMELDUNG_PRICE', payload: x.saveAction })));

        this.currentPreismeldung$
            .filter(x => !!x && x.lastSaveAction === 'SAVE_AND_NAVIGATE_TO_DASHBOARD')
            .subscribe(() => this.navController.setRoot(DashboardPage).then(() => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null })));

        const dialogNewPmbearbeitungsCode$ = Observable.defer(() => pefDialogService.displayDialog(DialogNewPmBearbeitungsCodeComponent, {}).map(x => x.data));
        const dialogSufficientPreismeldungen$ = Observable.defer(() => pefDialogService.displayDialog(PefDialogYesNoComponent, translateService.instant('dialogText_sufficientPreismeldungen')).map(x => x.data));

        const requestSelectPreismeldung$ = this.selectPreismeldung$
            .withLatestFrom(this.currentPreismeldung$.startWith(null), (selectedPreismeldung: P.PreismeldungBag, currentPreismeldung: P.CurrentPreismeldungBag) => ({
                selectedPreismeldung,
                currentPreismeldung,
                isCurrentModified: !!currentPreismeldung && currentPreismeldung.isModified
            }));

        requestSelectPreismeldung$
            .filter(x => !x.isCurrentModified)
            .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: x.selectedPreismeldung.pmId }));

        const cancelEditReponse$ = requestSelectPreismeldung$
            .filter(x => x.isCurrentModified)
            .flatMap(x => cancelEditDialog$.map(y => ({ selectedPreismeldung: x.selectedPreismeldung, dialogCode: y })))
            .publishReplay(1).refCount();

        cancelEditReponse$
            .filter(x => x.dialogCode === 'THROW_CHANGES')
            .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: x.selectedPreismeldung.pmId }));

        this.requestPreismeldungSave$ = this.toolbarButtonClicked$.filter(x => x === 'PREISMELDUNG_SAVE').map(() => ({ saveAction: 'SAVE_AND_MOVE_TO_NEXT' }))
            .merge(cancelEditReponse$.filter(x => x.dialogCode === 'SAVE').map(() => ({ saveAction: 'SAVE_AND_MOVE_TO_NEXT' })))
            .merge(requestNavigateHome$.filter(x => x === 'SAVE').map(() => ({ saveAction: 'SAVE_AND_NAVIGATE_TO_DASHBOARD' })));

        this.duplicatePreismeldung$
            .withLatestFrom(this.currentPreismeldung$, this.priceCountStatuses$, (_, currentPreismeldung: P.PreismeldungBag, priceCountStatuses: P.PriceCountStatusMap) => priceCountStatuses[currentPreismeldung.preismeldung.epNummer])
            .flatMap(priceCountStatus => priceCountStatus.enough ? dialogSufficientPreismeldungen$ : Observable.of('YES'))
            .filter(x => x === 'YES')
            .merge(this.save$.filter(x => x.saveAction === 'SAVE_AND_DUPLICATE_PREISMELDUNG'))
            .flatMap(() => dialogNewPmbearbeitungsCode$)
            .filter(x => x.action === 'OK')
            .subscribe(x => this.store.dispatch({ type: 'DUPLICATE_PREISMELDUNG', payload: x.bearbeitungscode }));

        this.addNewPreisreihe$
            .subscribe(() => this.navController.setRoot(NewPriceSeriesPage, { pmsNummer: this.navParams.get('pmsNummer') }));

        const isCurrentNotANewPreismeldung$ = this.currentPreismeldung$
            .take(1)
            .filter(x => !x || (!!x && !x.isNew))
            .publishReplay(1).refCount();

        this.ionViewDidLoad$
            .withLatestFrom(isCurrentNotANewPreismeldung$)
            .subscribe(() => this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: this.navParams.get('pmsNummer') }));

        isCurrentNotANewPreismeldung$
            .subscribe(() => this.store.dispatch({ type: 'PREISMELDUNGEN_RESET' }));
    }

    ionViewDidLoad() {
        this.ionViewDidLoad$.emit();
    }
}

