import { Component, Output, Input, OnChanges, OnDestroy, SimpleChange, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ReactiveComponent } from '../../';

@Component({
    selector: 'pef-search-input',
    template: `
        <ion-item class="pef-label" *ngIf="!!label">
            <ion-label>{{label}}</ion-label>
        </ion-item>
        <ion-item class="pef-search">
            <ion-label>
                <pef-icon name="search"></pef-icon>
            </ion-label>
            <ion-input type="text" clearInput [formControl]="filterText"></ion-input>
        </ion-item>`,
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
            .mapTo(null)
            .merge(this.observePropertyCurrentValue<string>('value'))
            .takeUntil(this.onDestroy$)
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
