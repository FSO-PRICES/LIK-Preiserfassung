import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

import { ReactiveComponent } from '../../../../../common/ReactiveComponent';

import * as P from '../../../../../common-models';

@Component({
    selector: 'preismeldung-attributes',
    templateUrl: 'preismeldung-attributes.html'
})
export class PreismeldungAttributesComponent extends ReactiveComponent {
    @Input() preismeldung: P.Preismeldung;

    public preismeldung$: Observable<P.PreismeldungViewModel>;

    constructor() {
        super();

        this.preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungViewModel>('preismeldung');

        this.preismeldung$
            .subscribe(x => console.log('PreismeldungAttributesComponent preismeldung$', x));
    }
}
