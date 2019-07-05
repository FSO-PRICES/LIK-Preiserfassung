import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChange } from '@angular/core';
import { FormControl } from '@angular/forms';
import { mapTo, merge, takeUntil } from 'rxjs/operators';

import { ReactiveComponent } from '../../common/ReactiveComponent';

@Component({
    selector: 'pef-search-input',
    styleUrls: ['./pef-search-input.scss'],
    templateUrl: 'pef-search-input.html',
})
export class PefSearchInput extends ReactiveComponent implements OnChanges, OnDestroy {
    public filterText = new FormControl();
    @Input() reset: any;
    @Input() label: string;
    @Input() value: string;
    @Output() valueChanges = this.filterText.valueChanges;

    private onDestroy$ = new EventEmitter();

    constructor() {
        super();
        this.observePropertyCurrentValue<any>('reset')
            .pipe(
                mapTo(null),
                merge(this.observePropertyCurrentValue<string>('value')),
                takeUntil(this.onDestroy$),
            )
            .subscribe(value => {
                this.filterText.patchValue(value);
            });
    }

    public ngOnDestroy() {
        this.onDestroy$.next();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
