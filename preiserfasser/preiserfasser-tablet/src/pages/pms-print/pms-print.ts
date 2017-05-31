import { Component, Input, Inject, SimpleChange, ElementRef, OnChanges, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';

import { ReactiveComponent, preisNumberFormattingOptions, mengeNumberFormattingOptions } from 'lik-shared';

import * as fromRoot from '../../reducers';

@Component({
    selector: 'pms-print',
    templateUrl: 'pms-print.html',
})
export class PmsPrintComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() pmsNummer: string;
    @Output('finishedPrinting') finishedPrinting$ = new EventEmitter();

    public preismeldungen$ = this.store.select(fromRoot.getPreismeldungen);
    public priceCountStatuses$ = this.store.select(fromRoot.getPriceCountStatuses);

    private mediaQueryList: MediaQueryList;
    private subscriptions = [];

    public preisNumberFormattingOptions = preisNumberFormattingOptions;
    public mengeNumberFormattingOptions = mengeNumberFormattingOptions;

    constructor(
        @Inject('windowObject') window: any,
        elementRef: ElementRef,
        private store: Store<fromRoot.AppState>,
    ) {
        super();

        this.mediaQueryListListener = this.mediaQueryListListener.bind(this);

        const pmsNummer$ = this.observePropertyCurrentValue<string>('pmsNummer').publishReplay(1).refCount();

        this.subscriptions.push(
            pmsNummer$
                .filter(pmsNummer => !!pmsNummer)
                .subscribe(payload => this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload }))
        );

        this.subscriptions.push(
            pmsNummer$
                .filter(pmsNummer => !pmsNummer)
                .subscribe(() => this.store.dispatch({ type: 'PREISMELDUNGEN_RESET' }))
        );

        this.subscriptions.push(
            store.select(fromRoot.getPreismeldungen)
                .withLatestFrom(pmsNummer$, (preismeldungen, pmsNummer) => ({ preismeldungen, pmsNummer }))
                .filter(x => !!x.pmsNummer && !!x.preismeldungen && x.preismeldungen.length > 0)
                .subscribe(() => setTimeout(() => {
                    window.print();
                }))
        );

        this.mediaQueryList = window.matchMedia('print');
        this.mediaQueryList.addListener(this.mediaQueryListListener);
    }

    mediaQueryListListener(mql) {
        if (!mql.matches) {
            this.finishedPrinting$.emit();
        }
    }

    ngOnDestroy() {
        this.mediaQueryList.removeListener(this.mediaQueryListListener);
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    _pageNumber = 0;
    pageNumber() {
        this._pageNumber = this._pageNumber + 1;
        return this._pageNumber;
    }
}
