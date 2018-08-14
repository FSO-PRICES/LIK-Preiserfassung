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

import { Directive, OnChanges, AfterViewInit, ElementRef, Input, SimpleChange, NgZone } from '@angular/core';
import * as Ps from 'perfect-scrollbar';
import { ReactiveComponent } from '../../common/ReactiveComponent';

@Directive({
    selector: '[pef-perfect-scrollbar]',
})
export class PefPerfectScrollbarDirective extends ReactiveComponent implements OnChanges, AfterViewInit {
    @Input() enabled: boolean;
    @Input() scrollToTop: {};

    private container: any;

    constructor(elementRef: ElementRef, private ngZone: NgZone) {
        super();

        this.container = elementRef.nativeElement;
    }

    ngAfterViewInit() {
        this.observePropertyCurrentValue<boolean>('enabled')
            .filter(x => x)
            .subscribe(() => {
                this.ngZone.runOutsideAngular(() => {
                    Ps.initialize(this.container);
                    setTimeout(() => {
                        this.container.scrollTop = 0;
                        Ps.update(this.container);
                    }, 1000);
                });
            });

        this.observePropertyCurrentValue<{}>('scrollToTop')
            .subscribe(() => {
                this.ngZone.runOutsideAngular(() => {
                    setTimeout(() => {
                        this.container.scrollTop = 0;
                        Ps.update(this.container);
                    }, 100);
                });
            });
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
