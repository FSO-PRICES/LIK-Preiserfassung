import { Component, Input, OnChanges, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs';

import { ReactiveComponent } from 'lik-shared';

import * as P from '../../../../../common-models';

@Component({
    selector: 'preismeldung-readonly-header',
    templateUrl: 'preismeldung-readonly-header.html'
})
export class PreismeldungReadonlyHeader extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;

    public preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');

    constructor() {
        super();
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
