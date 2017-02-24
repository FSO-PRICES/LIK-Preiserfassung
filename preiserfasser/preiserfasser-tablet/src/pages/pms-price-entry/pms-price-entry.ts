import { Component, EventEmitter, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { NavParams, NavController } from 'ionic-angular';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';

import * as P from '../../common-models';
import { PefDialogService } from 'lik-shared';

import * as fromRoot from '../../reducers';

import { DialogCancelEditComponent } from './components/dialog-cancel-edit/dialog-cancel-edit';

@Component({
    selector: 'pms-price-entry',
    templateUrl: 'pms-price-entry.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PmsPriceEntryPage {
    isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    preismeldestelle$ = this.store.select(fromRoot.getCurrentPreismeldestelle);
    preismeldungen$ = this.store.select(fromRoot.getPreismeldungen);
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldung).publishReplay(1).refCount();
    currentLanguage$ = this.store.select(fromRoot.getCurrentLanguage).publishReplay(1).refCount();

    selectPreismeldung$ = new EventEmitter<P.Models.Preismeldung>();
    save$ = new EventEmitter<{ saveAction: P.SavePreismeldungPricePayloadType }>();
    updatePreismeldungPreis$ = new EventEmitter<{ saveAction: P.SavePreismeldungPricePayloadType }>();

    selectTab$ = new EventEmitter<string>();
    toolbarButtonClicked$ = new EventEmitter<string>();

    requestPreismeldungSave$: Observable<{}>;
    requestPreismeldungQuickEqual$: Observable<{}>;

    selectedTab$ = this.selectTab$
        .startWith('PREISMELDUNG')
        .publishReplay(1).refCount();

    constructor(
        private navController: NavController,
        private navParams: NavParams,
        private pefDialogService: PefDialogService,
        private store: Store<fromRoot.AppState>,
        private zone: NgZone
    ) {
        this.toolbarButtonClicked$
            .filter(x => x === 'HOME')
            .subscribe(() => this.navController.pop());

        this.requestPreismeldungSave$ = this.toolbarButtonClicked$
            .filter(x => x === 'PREISMELDUNG_SAVE')
            .map(() => new Date());

        this.requestPreismeldungQuickEqual$ = this.toolbarButtonClicked$
            .filter(x => x === 'PREISMELDUNG_QUICK_EQUAL')
            .map(() => new Date());

        this.updatePreismeldungPreis$
            .subscribe(x => store.dispatch({ type: 'UPDATE_PREISMELDUNG_PRICE', payload: x }));

        this.save$
            // why do I need this setTimeout - is it an Ionic bug? requires two touches on tablet to register 'SAVE_AND_MOVE_TO_NEXT'
            .subscribe(x => setTimeout(() => store.dispatch({ type: 'SAVE_PREISMELDUNG_PRICE', payload: x })));

        const cancelEditDialog$ = Observable.defer(() => pefDialogService.displayDialog(DialogCancelEditComponent, {}).map(x => x.data));

        const requestSelectPreismeldung$ = this.selectPreismeldung$
            .withLatestFrom(this.currentPreismeldung$.startWith(null), (selectedPreismeldung: P.PreismeldungBag, currentPreismeldung: P.CurrentPreismeldungViewModel) => ({
                selectedPreismeldung,
                currentPreismeldung,
                isCurrentModified: !!currentPreismeldung && currentPreismeldung.isModified
            }));

        requestSelectPreismeldung$
            .filter(x => !x.isCurrentModified)
            .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: x.selectedPreismeldung.pmId }));

        requestSelectPreismeldung$
            .filter(x => x.isCurrentModified)
            .flatMap(x => cancelEditDialog$.map(y => ({ selectedPreismeldung: x.selectedPreismeldung, dialogCode: y })))
            .filter(x => x.dialogCode === 'THROW_CHANGES')
            .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: x.selectedPreismeldung.pmId }));
    }

    ionViewDidLoad() {
        this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: this.navParams.get('pmsNummer') });
    }

    ionViewDidLeave() {
        this.store.dispatch({ type: 'PREISMELDUNGEN_CLEAR' });
    }
}
