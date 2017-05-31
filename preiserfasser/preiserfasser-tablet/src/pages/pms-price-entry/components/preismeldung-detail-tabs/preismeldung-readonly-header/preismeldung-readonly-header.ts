import { Component, Input, OnChanges, SimpleChange, Inject, EventEmitter, OnDestroy } from '@angular/core';

import { ReactiveComponent } from 'lik-shared';

import * as P from '../../../../../common-models';

@Component({
    selector: 'preismeldung-readonly-header',
    templateUrl: 'preismeldung-readonly-header.html'
})
export class PreismeldungReadonlyHeader extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() preismeldestelle: P.Models.Preismeldestelle;

    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('preismeldung');
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle').publishReplay(1).refCount();

    public navigateToInternetLink$ = new EventEmitter();

    private subscriptions = [];

    constructor(@Inject('windowObject') public window: any) {
        super();

        this.subscriptions.push(
            this.navigateToInternetLink$.withLatestFrom(this.preismeldestelle$, this.preismeldung$, (_, __, bag) => bag)
                .map(bag => bag.preismeldung.internetLink)
                .subscribe(internetLink => {
                    if (!internetLink) return;
                    if (!internetLink.startsWith('http://') || !internetLink.startsWith('https://')) {
                        this.window.open(`http://${internetLink}`, '_blank');
                    }
                })
        );
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}
