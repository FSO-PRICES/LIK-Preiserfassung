import { Component, Input, Output, OnChanges, SimpleChange, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

import { ReactiveComponent } from 'lik-shared';

import * as P from '../../../../../common-models';

@Component({
    selector: 'preismeldung-info',
    templateUrl: 'preismeldung-info.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldungInfoComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() priceCountStatus: P.PriceCountStatus;
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Output('resetClicked') resetClicked$ = new EventEmitter();
    @Input() isDesktop: boolean;

    public preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle');
    public isDesktop$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isDesktop');

    public numberFormattingOptions = { padRight: 2, truncate: 2, integerSeparator: '' };

    constructor() {
        super();
    }

    formatPreismeldungId(bag: P.PreismeldungBag) {
        return !bag ? '' : `${bag.preismeldung.pmsNummer}/${bag.preismeldung.epNummer}/${bag.preismeldung.laufnummer}`;
    }

    formatInternetLink(link: string) {
        if (!link) return link;
        return (!link.startsWith('http://') || !link.startsWith('https://')) ? `http://${link}` : link;
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
