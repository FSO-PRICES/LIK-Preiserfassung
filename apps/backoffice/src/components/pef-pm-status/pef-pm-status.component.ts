import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Models as P } from '@lik-shared';

@Component({
    selector: 'pef-pm-status',
    templateUrl: 'pef-pm-status.component.html',
    styleUrls: ['pef-pm-status.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PefPmStatusComponent {
    @Input() disabled: boolean;
    @Input() preismeldungStatus: P.PreismeldungStatus;
    @Output('setPreismeldungStatus') setPreismeldungStatus$: Observable<P.PreismeldungStatus>;

    public inputChanged$ = new EventEmitter<string>();

    constructor() {
        this.setPreismeldungStatus$ = this.inputChanged$.asObservable().pipe(map(x => +x));
    }
}
