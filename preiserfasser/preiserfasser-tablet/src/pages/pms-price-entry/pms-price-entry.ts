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
    warenkorb$ = this.store.select(fromRoot.getWarenkorb);

    selectPreismeldung$ = new EventEmitter<P.Models.Preismeldung>();
    save$ = new EventEmitter<{ saveAction: P.SavePreismeldungPricePayloadType }>();
    updatePreismeldungPreis$ = new EventEmitter<{ saveAction: P.SavePreismeldungPricePayloadType }>();
    duplicatePreismeldung$ = new EventEmitter();
    addNewPreisreihe$ = new EventEmitter();
    ionViewDidLoad$ = new EventEmitter();

    selectTab$ = new EventEmitter<string>();
    toolbarButtonClicked$ = new EventEmitter<string>();

    requestPreismeldungSave$: Observable<{}>;
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
        this.toolbarButtonClicked$
            .filter(x => x === 'HOME')
            .subscribe(() => this.navController.setRoot(DashboardPage));

        this.requestPreismeldungQuickEqual$ = this.toolbarButtonClicked$
            .filter(x => x === 'PREISMELDUNG_QUICK_EQUAL')
            .map(() => new Date());

        this.updatePreismeldungPreis$
            .subscribe(x => store.dispatch({ type: 'UPDATE_PREISMELDUNG_PRICE', payload: x }));

        this.save$
            // why do I need this setTimeout - is it an Ionic bug? requires two touches on tablet to register 'SAVE_AND_MOVE_TO_NEXT'
            .subscribe(x => setTimeout(() => store.dispatch({ type: 'SAVE_PREISMELDUNG_PRICE', payload: x })));

        const cancelEditDialog$ = Observable.defer(() => pefDialogService.displayDialog(DialogCancelEditComponent, {}).map(x => x.data));
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

        this.requestPreismeldungSave$ = this.toolbarButtonClicked$
            .filter(x => x === 'PREISMELDUNG_SAVE')
            .merge(cancelEditReponse$.filter(x => x.dialogCode === 'SAVE'))
            .map(() => new Date());

        this.duplicatePreismeldung$
            .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung: P.PreismeldungBag) => currentPreismeldung)
            .flatMap(currentPreismeldung => currentPreismeldung.priceCountStatus.ok ? dialogSufficientPreismeldungen$ : Observable.of('YES'))
            .filter(x => x === 'YES')
            .flatMap(() => dialogNewPmbearbeitungsCode$)
            .filter(x => x.action === 'OK')
            .subscribe(x => this.store.dispatch({ type: 'DUPLICATE_PREISMELDUNG', payload: x.bearbeitungscode }));

        this.addNewPreisreihe$
            .subscribe(() => this.navController.setRoot(NewPriceSeriesPage, { pmsNummer: this.navParams.get('pmsNummer') }));

        this.ionViewDidLoad$
            .withLatestFrom(this.store.select(x => x.preismeldungen), (_, preismeldungen) => preismeldungen.pmsNummer)
            .filter(pmsNummer => pmsNummer !== this.navParams.get('pmsNummer'))
            .take(1)
            .subscribe(() => this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: this.navParams.get('pmsNummer') }));
    }

    ionViewDidLoad() {
        this.ionViewDidLoad$.emit();
    }
}

