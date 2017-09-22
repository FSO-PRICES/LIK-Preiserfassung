import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange } from '@angular/core';

import { ReactiveComponent } from 'lik-shared';

@Component({
    selector: 'stichtage',
    templateUrl: 'stichtage.html'
})
export class StichtageComponent extends ReactiveComponent implements OnChanges {
    @Input() reportExecuting: boolean;
    @Output('runReport') runReport$ = new EventEmitter();

    public reportExecuting$ = this.observePropertyCurrentValue<boolean>('reportExecuting');

    constructor() {
        super();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
