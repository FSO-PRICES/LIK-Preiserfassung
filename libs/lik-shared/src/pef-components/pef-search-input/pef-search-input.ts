/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    forwardRef,
    HostBinding,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChange,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { mapTo, merge, shareReplay, takeUntil } from 'rxjs/operators';

import { ReactiveComponent } from '../../common/ReactiveComponent';

@Component({
    selector: 'pef-search-input',
    styleUrls: ['./pef-search-input.scss'],
    templateUrl: 'pef-search-input.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PefSearchInput),
            multi: true,
        },
    ],
})
export class PefSearchInput extends ReactiveComponent implements ControlValueAccessor, OnChanges, OnDestroy {
    public filterText = new FormControl();
    @Input() reset: any;
    @Input() label: string;
    @Input() value: string;
    @Input() placeholder: string;
    @Input() @HostBinding('class.no-padding') noPadding: boolean;
    @Input() @HostBinding('class.compact') compact: boolean;
    @Output() valueChanges: Observable<string>;

    private onChange = (value: string) => {};
    private onTouched = () => {};

    public onTouched$ = new EventEmitter();
    private onDestroy$ = new EventEmitter();

    constructor() {
        super();
        this.valueChanges = this.filterText.valueChanges.pipe(shareReplay({ bufferSize: 1, refCount: true }));
        this.observePropertyCurrentValue<any>('reset')
            .pipe(
                mapTo(null),
                merge(this.observePropertyCurrentValue<string>('value')),
                takeUntil(this.onDestroy$),
            )
            .subscribe(value => {
                this.filterText.setValue(value);
            });
        this.valueChanges.pipe(takeUntil(this.onDestroy$)).subscribe(value => this.onChange(value));
        this.onTouched$.pipe(takeUntil(this.onDestroy$)).subscribe(() => this.onTouched());
    }

    public ngOnDestroy() {
        this.onDestroy$.next();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    writeValue(value: string): void {
        this.filterText.setValue(value);
    }
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
}
