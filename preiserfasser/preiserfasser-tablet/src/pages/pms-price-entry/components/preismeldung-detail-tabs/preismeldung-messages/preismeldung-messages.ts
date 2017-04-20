import { Component, Input, OnChanges, SimpleChange } from '@angular/core';

import { ReactiveComponent } from 'lik-shared';

import * as P from '../../../../../common-models';

@Component({
    selector: 'preismeldung-messages',
    templateUrl: 'preismeldung-messages.html'
})
export class PreismeldungMessagesComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.Models.Preismeldung;
    @Input() priceCountStatus: P.PriceCountStatus;

    public preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');

    constructor() {
        super();
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
