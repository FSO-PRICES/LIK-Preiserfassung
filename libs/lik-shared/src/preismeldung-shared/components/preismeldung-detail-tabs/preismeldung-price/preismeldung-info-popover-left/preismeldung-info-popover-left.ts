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
    ElementRef,
    EventEmitter,
    HostBinding,
    Inject,
    Input,
    OnChanges,
    Output,
    SimpleChange,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { WINDOW } from 'ngx-window-token';
import { Observable, of as observableOf } from 'rxjs';
import { filter, map, merge, publishReplay, refCount, scan, startWith } from 'rxjs/operators';

import {
    formatPercentageChange,
    mengeNumberFormattingOptions,
    preisNumberFormattingOptions,
    ReactiveComponent,
} from '../../../../../common/';
import * as P from '../../../../models';

@Component({
    selector: 'preismeldung-info-popover-left',
    styleUrls: ['./preismeldung-info-popover-left.scss'],
    templateUrl: 'preismeldung-info-popover-left.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungInfoPopoverLeft extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() forceClose: {};
    @Input() height: string;
    @Input() extraWidth: string;
    @Input() @HostBinding('class.has-warning') hasWarning = false;
    @Output('popoverActive') popoverActive$: Observable<boolean>;

    public preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
    public buttonClicked$ = new EventEmitter();
    public popoverLeft$: Observable<string>;
    public popoverWidth$: Observable<string>;
    public popoverHeight$: Observable<string>;
    public popoverMaxHeight$: Observable<string>;
    public comparisonContainerWidth$: Observable<number>;

    public preisNumberFormattingOptions = preisNumberFormattingOptions;
    public mengeNumberFormattingOptions = mengeNumberFormattingOptions;

    constructor(elementRef: ElementRef, public sanitizer: DomSanitizer, @Inject(WINDOW) private wndw: Window) {
        super();

        this.comparisonContainerWidth$ = observableOf(300);

        this.popoverActive$ = this.buttonClicked$.pipe(
            map(x => ({ type: 'TOGGLE' })),
            merge(this.observePropertyCurrentValue<{}>('forceClose').pipe(map(_ => ({ type: 'SET', value: false })))),
            scan<{ type: 'TOGGLE' | 'SET'; value?: boolean }, boolean>((active: boolean, v) => {
                if (v.type === 'TOGGLE') return !active;
                return v.value;
            }, false),
            startWith(false),
            publishReplay(1),
            refCount(),
        );

        const recalcPopover$ = this.popoverActive$.pipe(
            filter(x => x),
            publishReplay(1),
            refCount(),
        );

        this.popoverWidth$ = recalcPopover$
            // .map(() => `calc(${elementRef.nativeElement.offsetLeft}px + ${elementRef.nativeElement.offsetWidth}px + ${this.extraWidth || '0px'} - 16px - ${this.pefRelativeSize(wndw.innerWidth, 1)})`);
            .pipe(
                map(
                    () =>
                        `calc(${elementRef.nativeElement.offsetLeft}px + ${
                            elementRef.nativeElement.offsetWidth
                        }px + ${this.extraWidth || '0px'} - ${this.pefRelativeSize(wndw.innerWidth, 1)})`,
                ),
            );

        this.popoverHeight$ = this.observePropertyCurrentValue<string>('height').pipe(
            map(height => `calc(${height || '0px'} + 1px)`),
        );

        this.popoverLeft$ = recalcPopover$.pipe(map(() => `calc(${this.pefRelativeSize(wndw.innerWidth, 1)})`));

        this.popoverMaxHeight$ = recalcPopover$.pipe(
            map(
                () =>
                    `calc(${elementRef.nativeElement.offsetParent.clientHeight}px - ${
                        elementRef.nativeElement.offsetTop
                    }px - ${elementRef.nativeElement.clientHeight}px - ${this.pefRelativeSize(wndw.innerWidth, 1)})`,
            ),
        );
    }

    formatPercentageChange = percentageChange => formatPercentageChange(percentageChange, 1);

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    pefRelativeSize(windowWidth: number, n: number) {
        return windowWidth <= 1280 ? `(${n} * 1em)` : `(${n} * 16px)`;
    }
}
