import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Models as P } from 'lik-shared';

@Component({
    selector: 'pef-pm-status',
    templateUrl: 'pef-pm-status.component.html',
})
export class PefPmStatusComponent {
    @Input() disabled: boolean;
    @Input() preismeldungStatus: P.PreismeldungStatus;
    @Output('setPreismeldungStatus') setPreismeldungStatus$: Observable<P.PreismeldungStatus>;

    public inputChanged$ = new EventEmitter<string>();

    constructor() {
        this.setPreismeldungStatus$ = this.inputChanged$.asObservable().map(x => +x);
    }
}
