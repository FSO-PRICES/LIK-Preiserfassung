import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { combineLatest, filter, map, publishReplay, refCount, take, withLatestFrom } from 'rxjs/operators';

import * as P from '../../common-models';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'new-price-series-page',
    templateUrl: 'new-price-series.page.html',
    styleUrls: ['new-price-series.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewPriceSeriesPage implements OnInit, OnDestroy {
    ionViewDidLoad$ = new EventEmitter();
    currentLanguage$ = this.store.select(fromRoot.getCurrentLanguage);
    isDesktop$ = this.store.select(fromRoot.getIsDesktop);

    warenkorb$: Observable<P.WarenkorbInfo[]>;
    preismeldungen$: Observable<P.PreismeldungBag[]>;
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldungViewBag);
    erhebungsInfo$ = this.store.select(fromRoot.getErhebungsInfo);

    closeChooseFromWarenkorb$ = new EventEmitter<{
        warenkorbPosition: P.Models.WarenkorbLeaf;
        bearbeitungscode: P.Models.Bearbeitungscode;
    }>();
    hideWarenkorbUiItem$ = new EventEmitter<P.WarenkorbUiItem>();
    resetView$ = new EventEmitter();

    private subscriptions: Subscription[] = [];

    constructor(
        activeRoute: ActivatedRoute,
        private navController: NavController,
        private store: Store<fromRoot.AppState>,
    ) {
        const pmsNummerParam$ = activeRoute.params.pipe(map(({ pmsNummer }) => pmsNummer as string));
        const ionViewDidLoad$ = this.ionViewDidLoad$.asObservable().pipe(
            publishReplay(1),
            refCount(),
        );

        this.warenkorb$ = ionViewDidLoad$.pipe(
            combineLatest(this.store.select(fromRoot.getWarenkorb), (_, warenkorb) => warenkorb),
        );
        this.preismeldungen$ = ionViewDidLoad$.pipe(
            combineLatest(this.store.select(fromRoot.getPreismeldungen), (_, preismeldungen) => preismeldungen),
        );

        this.subscriptions.push(
            ionViewDidLoad$
                .pipe(
                    withLatestFrom(pmsNummerParam$, this.store.select(x => x.preismeldungen.pmsNummer)),
                    filter(([, pmsNummerParam, pmsNummer]) => pmsNummer !== pmsNummerParam),
                    take(1),
                )
                .subscribe(([, pmsNummerParam]) =>
                    this.store.dispatch({
                        type: 'PREISMELDUNGEN_LOAD_FOR_PMS',
                        payload: pmsNummerParam,
                    }),
                ),
        );

        this.subscriptions.push(
            this.hideWarenkorbUiItem$
                .asObservable()
                .subscribe(warenkorbUiItem =>
                    this.store.dispatch({ type: 'HIDE_WARENKORB_UI_ITEM', payload: warenkorbUiItem }),
                ),
            this.resetView$.asObservable().subscribe(() =>
                this.store.dispatch({
                    type: 'RESET_WARENKORB_VIEW',
                }),
            ),
            this.closeChooseFromWarenkorb$.pipe(withLatestFrom(pmsNummerParam$)).subscribe(([x, pmsNummer]) => {
                if (!!x) {
                    this.store.dispatch({
                        type: 'NEW_PREISMELDUNG',
                        payload: {
                            warenkorbPosition: x.warenkorbPosition,
                            bearbeitungscode: x.bearbeitungscode,
                            pmsNummer,
                        },
                    });
                }
                this.navigateToPmsPriceEntry(pmsNummer);
            }),
        );
    }

    ngOnInit() {
        this.ionViewDidLoad$.emit();
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    navigateToPmsPriceEntry(pmsNummer: string) {
        this.navController.navigateRoot(['pms-price-entry', pmsNummer]);
    }
}
