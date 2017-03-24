import { Component, EventEmitter, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { NavParams, NavController } from 'ionic-angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import * as P from '../../common-models';
import { PmsPriceEntryPage } from '../pms-price-entry';

import * as fromRoot from '../../reducers';

@Component({
    selector: 'new-price-series-page',
    templateUrl: 'new-price-series.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewPriceSeriesPage implements OnDestroy {
    ionViewDidLoad$ = new EventEmitter();
    currentLanguage$ = this.store.select(fromRoot.getCurrentLanguage);
    isDesktop$ = this.store.select(fromRoot.getIsDesktop);

    warenkorb$ = this.ionViewDidLoad$.combineLatest(this.store.select(fromRoot.getWarenkorb), (_, warenkorb) => warenkorb);
    preismeldungen$ = this.ionViewDidLoad$.combineLatest(this.store.select(fromRoot.getPreismeldungen), (_, preismeldungen) => preismeldungen);

    closeChooseFromWarenkorb$ = new EventEmitter<{ warenkorbPosition: P.Models.WarenkorbLeaf, bearbeitungscode: P.Models.Bearbeitungscode }>();

    private subscriptions: Subscription[] = [];

    constructor(private navController: NavController, private navParams: NavParams, private store: Store<fromRoot.AppState>) {
        this.subscriptions.push(
            this.ionViewDidLoad$
                .withLatestFrom(this.store.select(x => x.preismeldungen.pmsNummer), (_, pmsNummer) => pmsNummer)
                .filter(pmsNummer => pmsNummer !== this.navParams.get('pmsNummer'))
                .take(1)
                .subscribe(() => this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: this.navParams.get('pmsNummer') }))
        );

        this.subscriptions.push(
            this.closeChooseFromWarenkorb$
                .filter(x => !!x)
                .subscribe(x => {
                    this.store.dispatch({ type: 'NEW_PREISMELDUNG', payload: { warenkorbPosition: x.warenkorbPosition, bearbeitungscode: x.bearbeitungscode, pmsNummer: this.navParams.get('pmsNummer') } });
                    this.navController.setRoot(PmsPriceEntryPage, { pmsNummer: this.navParams.get('pmsNummer') });
                })
        );
    }

    ionViewDidLoad() {
        this.ionViewDidLoad$.emit();
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}
