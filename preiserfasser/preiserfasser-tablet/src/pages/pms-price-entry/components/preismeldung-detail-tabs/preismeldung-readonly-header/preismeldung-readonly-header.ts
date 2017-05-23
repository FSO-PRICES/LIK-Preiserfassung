import { Component, Input, OnChanges, SimpleChange, Inject, EventEmitter } from '@angular/core';

import { ReactiveComponent } from 'lik-shared';

import * as P from '../../../../../common-models';

@Component({
    selector: 'preismeldung-readonly-header',
    templateUrl: 'preismeldung-readonly-header.html'
})
export class PreismeldungReadonlyHeader extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() preismeldestelle: P.Models.Preismeldestelle;

    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('preismeldung');
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle').publishReplay(1).refCount();

    public navigateToInternetLink$ = new EventEmitter();

    constructor(@Inject('windowObject') public window: Window) {
        super();

        this.navigateToInternetLink$.withLatestFrom(this.preismeldestelle$, this.preismeldung$, (_, __, bag) => bag)
            .map(bag => bag.preismeldung.internetLink)
            .subscribe(internetLink => {
                if (!internetLink) return;
                if (!internetLink.startsWith('http://') || !internetLink.startsWith('https://')) {
                    this.window.open(`http://${internetLink}`, '_blank');
                }
            });
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
