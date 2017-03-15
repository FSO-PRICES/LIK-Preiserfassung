import { Component, Input, Output, EventEmitter, OnChanges, SimpleChange } from '@angular/core';

import { ReactiveComponent, PefDialogService } from 'lik-shared';

import * as P from '../../../../common-models';

@Component({
    selector: 'preismeldungen-sort',
    templateUrl: 'preismeldungen-sort.html'
})
export class PreismeldungenSortComponent extends ReactiveComponent implements OnChanges {
    @Input() isDesktop: boolean;
    @Input() preismeldungen: P.PreismeldungBag[];

    public preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen');

    constructor(private pefDialogService: PefDialogService) {
        super();

        this.preismeldungen$.subscribe(x => console.log('got', x));
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        console.log('got change', changes)
        this.baseNgOnChanges(changes);
    }
}

