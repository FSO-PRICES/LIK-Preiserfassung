import { Component, Input, Output, EventEmitter, OnChanges, SimpleChange, OnDestroy } from '@angular/core';

import { ReactiveComponent, PefDialogService } from 'lik-shared';

import * as P from '../../../../common-models';
import { subMilliseconds } from 'date-fns';

@Component({
    selector: 'preismeldungen-sort',
    templateUrl: 'preismeldungen-sort.html'
})
export class PreismeldungenSortComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() isDesktop: boolean;
    @Input() preismeldungen: P.PreismeldungBag[];

    public preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen');

    private subscriptions = [];

    constructor(private pefDialogService: PefDialogService) {
        super();

        this.subscriptions.push(this.preismeldungen$.subscribe(x => console.log('got', x)));
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}

