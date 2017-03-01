import { Component, Input, OnChanges, SimpleChange } from '@angular/core';

import { ReactiveComponent } from 'lik-shared';

import * as P from '../../../../../common-models';

@Component({
    selector: 'preismeldung-info',
    templateUrl: 'preismeldung-info.html'
})
export class PreismeldungInfoComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;
    public preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');

    public numberFormattingOptions = { padRight: 2, truncate: 2, integerSeparator: '' };

    constructor() {
        super();
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
