import { Component, Input, Inject, SimpleChange, ElementRef, OnChanges, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';

import { ReactiveComponent } from 'lik-shared';

import * as fromRoot from '../../reducers';

@Component({
    selector: 'pms-print2',
    templateUrl: 'pms-print2.html'
})
export class PmsPrintComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() pmsNummer: string;
    @Output('finishedPrinting') finishedPrinting$ = new EventEmitter();

    public preismeldungen$ = this.store.select(fromRoot.getPreismeldungen);

    private mediaQueryList: MediaQueryList;
    private subscriptions = [];

    constructor(
        @Inject('windowObject') window: Window,
        elementRef: ElementRef,
        private store: Store<fromRoot.AppState>,
    ) {
        super();

        const pmsNummer$ = this.observePropertyCurrentValue<string>('pmsNummer').do(x => console.log('pmsNummer is', x)).publishReplay(1).refCount();

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
                .filter(x => !!x && x.length > 0)
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
}
