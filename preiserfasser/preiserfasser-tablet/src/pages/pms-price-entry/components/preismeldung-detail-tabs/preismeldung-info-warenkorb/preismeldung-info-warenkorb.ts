import { Component, Input, OnChanges, SimpleChange } from '@angular/core';

import { ReactiveComponent } from 'lik-shared';

import * as P from '../../../../../common-models';

@Component({
    selector: 'preismeldung-info-warenkorb',
    templateUrl: 'preismeldung-info-warenkorb.html'
})
export class PreismeldungInfoWarenkorbComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() priceCountStatus: P.PriceCountStatus;

    public preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');

    public numberFormattingOptions = { padRight: 2, truncate: 2, integerSeparator: '' };

    constructor() {
        super();
    }

    ifMonth(v: number, m: number) {
        return v & (1 << m);
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
