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
    AfterViewInit,
    Directive,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    OnChanges,
    SimpleChange,
} from '@angular/core';
import * as Ps from 'perfect-scrollbar';
import { combineLatest, filter, map } from 'rxjs/operators';
import { ReactiveComponent } from '../../common/ReactiveComponent';

@Directive({
    selector: '[pef-perfect-virtualscroll-scrollbar]',
})
export class PefPerfectVirtualscrollScrollbarDirective extends ReactiveComponent implements OnChanges, AfterViewInit {
    @Input() enabled: boolean;

    private ngAfterViewInit$ = new EventEmitter();

    constructor(elementRef: ElementRef, ngZone: NgZone) {
        super();

        const enabled$ = this.observePropertyCurrentValue<boolean>('enabled');
        this.ngAfterViewInit$
            .pipe(
                combineLatest(enabled$, (_, enabled) => enabled),
                filter(enabled => enabled),
                map(() => elementRef.nativeElement.getElementsByClassName('scroll-content')[0] as HTMLInputElement),
                filter(scrollContent => !!scrollContent),
            )
            .subscribe(scrollContent => {
                ngZone.runOutsideAngular(() => {
                    Ps.initialize(scrollContent);
                    setTimeout(() => {
                        scrollContent.scrollTop = 0;
                        Ps.update(scrollContent);
                    }, 1000);
                });
            });
    }

    ngAfterViewInit() {
        this.ngAfterViewInit$.emit();
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
