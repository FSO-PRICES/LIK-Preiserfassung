import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { NavController, NavParams } from '@ionic/angular';
import { Store } from '@ngrx/store';

import { Subscription } from 'rxjs';

import { combineLatest, filter, publishReplay, refCount, take, withLatestFrom } from 'rxjs/operators';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'pms-sort-page',
    templateUrl: 'pms-sort.page.html',
    styleUrls: ['pms-sort.page.scss'],
})
export class PmsSortPage implements OnDestroy {
    ionViewDidLoad$ = new EventEmitter();
    closeClicked$ = new EventEmitter();
    save$ = new EventEmitter();
    isDesktop$ = this.store.select(fromRoot.getIsDesktop).pipe(
        publishReplay(1),
        refCount(),
    );
    preismeldungen$ = this.ionViewDidLoad$.pipe(
        combineLatest(this.store.select(fromRoot.getPreismeldungen), (_, preismeldungen) => preismeldungen),
    );

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
            this.closeClicked$.subscribe(() => {
                this.store.dispatch({ type: 'PREISMELDUNGEN_RESET' });
                this.navController.navigateRoot(['/pms-price-entry/', this.navParams.get('pmsNummer')]);
            }),
        );
        this.subscriptions.push(
            this.save$.subscribe(sortOrderDoc =>
                this.store.dispatch({
                    type: 'PREISMELDUNGEN_SORT_SAVE',
                    payload: { pmsNummer: this.navParams.get('pmsNummer'), sortOrderDoc },
                }),
            ),
        );
    }

    ionViewDidLoad() {
        this.ionViewDidLoad$.emit();
    }

    public ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }
}
