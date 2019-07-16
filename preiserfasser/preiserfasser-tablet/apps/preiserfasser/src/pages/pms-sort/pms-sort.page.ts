import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Store } from '@ngrx/store';

import { Observable, Subscription } from 'rxjs';

import { combineLatest, filter, map, publishReplay, refCount, take, withLatestFrom } from 'rxjs/operators';
import * as P from '../../common-models';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'pms-sort-page',
    templateUrl: 'pms-sort.page.html',
    styleUrls: ['pms-sort.page.scss'],
})
export class PmsSortPage implements OnInit, OnDestroy {
    ionViewDidLoad$ = new EventEmitter();
    closeClicked$ = new EventEmitter();
    save$ = new EventEmitter();
    isDesktop$ = this.store.select(fromRoot.getIsDesktop).pipe(
        publishReplay(1),
        refCount(),
    );
    preismeldungen$: Observable<P.PreismeldungBag[]>;

    private subscriptions: Subscription[] = [];

    constructor(
        activeRoute: ActivatedRoute,
        private navController: NavController,
        private store: Store<fromRoot.AppState>,
    ) {
        const params$ = activeRoute.params.pipe(map(({ pmsNummer }) => pmsNummer));
        const ionViewDidLoad$ = this.ionViewDidLoad$.asObservable().pipe(
            publishReplay(1),
            refCount(),
        );

        this.preismeldungen$ = ionViewDidLoad$.pipe(
            combineLatest(this.store.select(fromRoot.getPreismeldungen), (_, preismeldungen) => preismeldungen),
        );
        this.subscriptions.push(
            ionViewDidLoad$
                .pipe(
                    withLatestFrom(params$, this.store.select(x => x.preismeldungen.pmsNummer)),
                    filter(([, paramsPmsNummer, pmsNummer]) => pmsNummer !== paramsPmsNummer),
                    take(1),
                )
                .subscribe(([, paramsPmsNummer]) =>
                    this.store.dispatch({
                        type: 'PREISMELDUNGEN_LOAD_FOR_PMS',
                        payload: paramsPmsNummer,
                    }),
                ),
        );

        this.subscriptions.push(
            this.closeClicked$.pipe(withLatestFrom(params$)).subscribe(([, paramsPmsNummer]) => {
                this.store.dispatch({ type: 'PREISMELDUNGEN_RESET' });
                this.navController.navigateRoot(['/pms-price-entry/', paramsPmsNummer]);
            }),
        );
        this.subscriptions.push(
            this.save$.pipe(withLatestFrom(params$)).subscribe(([sortOrderDoc, paramsPmsNummer]) =>
                this.store.dispatch({
                    type: 'PREISMELDUNGEN_SORT_SAVE',
                    payload: { pmsNummer: paramsPmsNummer, sortOrderDoc },
                }),
            ),
        );
    }

    ngOnInit() {
        this.ionViewDidLoad$.emit();
    }

    public ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }
}
