import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy } from '@angular/core';
import { NavController, NavParams } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { combineLatest, filter, flatMap, take, withLatestFrom } from 'rxjs/operators';

import * as P from '../../common-models';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'new-price-series-page',
    templateUrl: 'new-price-series.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewPriceSeriesPage implements OnDestroy {
    ionViewDidLoad$ = new EventEmitter();
    currentLanguage$ = this.store.select(fromRoot.getCurrentLanguage);
    isDesktop$ = this.store.select(fromRoot.getIsDesktop);

    warenkorb$ = this.ionViewDidLoad$.pipe(
        combineLatest(this.store.select(fromRoot.getWarenkorb), (_, warenkorb) => warenkorb),
    );
    preismeldungen$ = this.ionViewDidLoad$.pipe(
        combineLatest(this.store.select(fromRoot.getPreismeldungen), (_, preismeldungen) => preismeldungen),
    );
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldungViewBag);
    erhebungsInfo$ = this.store.select(fromRoot.getErhebungsInfo);

    closeChooseFromWarenkorb$ = new EventEmitter<{
        warenkorbPosition: P.Models.WarenkorbLeaf;
        bearbeitungscode: P.Models.Bearbeitungscode;
    }>();

    private subscriptions: Subscription[] = [];

    constructor(
        private navController: NavController,
        private navParams: NavParams,
        private store: Store<fromRoot.AppState>,
    ) {
        this.subscriptions.push(
            this.ionViewDidLoad$
                .pipe(
                    withLatestFrom(this.store.select(x => x.preismeldungen.pmsNummer), (_, pmsNummer) => pmsNummer),
                    filter(pmsNummer => pmsNummer !== this.navParams.get('pmsNummer')),
                    take(1),
                )
                .subscribe(() =>
                    this.store.dispatch({
                        type: 'PREISMELDUNGEN_LOAD_FOR_PMS',
                        payload: this.navParams.get('pmsNummer'),
                    }),
                ),
        );

        this.subscriptions.push(
            this.closeChooseFromWarenkorb$
                .pipe(
                    flatMap(x => {
                        if (!!x) {
                            this.store.dispatch({
                                type: 'NEW_PREISMELDUNG',
                                payload: {
                                    warenkorbPosition: x.warenkorbPosition,
                                    bearbeitungscode: x.bearbeitungscode,
                                    pmsNummer: this.navParams.get('pmsNummer'),
                                },
                            });
                        }
                        return this.navigateToPmsPriceEntry();
                    }),
                )
                .subscribe(),
        );
    }

    ionViewDidLoad() {
        this.ionViewDidLoad$.emit();
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    navigateToPmsPriceEntry() {
        return this.navController.navigateRoot('PmsPriceEntryPage', {
            queryParams: { pmsNummer: this.navParams.get('pmsNummer') },
        });
    }
}
