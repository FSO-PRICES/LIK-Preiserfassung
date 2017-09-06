import { Component, Input, OnChanges, SimpleChange } from '@angular/core';
import { reverse } from 'lodash';

import { ReactiveComponent } from 'lik-shared';

import * as P from '../../../models';
import { Observable } from 'rxjs';

@Component({
    selector: 'preismeldung-info-warenkorb',
    templateUrl: 'preismeldung-info-warenkorb.html'
})
export class PreismeldungInfoWarenkorbComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() priceCountStatus: P.PriceCountStatus;
    @Input() warenkorb: P.WarenkorbInfo[];
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Input() isDesktop: boolean;
    @Input() isAdminApp: boolean;

    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('preismeldung');
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    public isDesktop$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isDesktop');
    public isAdminApp$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isAdminApp');
    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle').publishReplay(1).refCount();

    public parentHierarchy$: Observable<P.WarenkorbInfo[]>;

    public numberFormattingOptions = { padRight: 2, truncate: 2, integerSeparator: '' };

    constructor() {
        super();

        const warenkorb$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('warenkorb');

        this.parentHierarchy$ = warenkorb$.combineLatest(this.preismeldung$.filter(x => !!x), (warenkorb, preismeldung) => {
            let warenkorbInfo = warenkorb.find(x => x.warenkorbItem.gliederungspositionsnummer === preismeldung.warenkorbPosition.parentGliederungspositionsnummer);
            let parentHierarchy = [];
            while (!!warenkorbInfo) {
                parentHierarchy = [...parentHierarchy, warenkorbInfo];
                warenkorbInfo = warenkorb.find(x => x.warenkorbItem.gliederungspositionsnummer === warenkorbInfo.warenkorbItem.parentGliederungspositionsnummer);
            }
            return reverse(parentHierarchy);
        });
    }

    ifMonth(v: number, m: number) {
        return v & (1 << m);
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
