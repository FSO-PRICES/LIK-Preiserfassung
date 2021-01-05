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

import { Directive, ElementRef, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { WINDOW } from 'ngx-window-token';
import { interval, of as observableOf } from 'rxjs';
import { flatMap, publishReplay, refCount, retry, take } from 'rxjs/operators';

@Directive({
    selector: '[pef-detect-ion-list-item-height]',
})
export class PefDetectIonListItemHeightDirective implements OnInit {
    @Input() itemTagName = 'ion-input';
    @Output('pef-detect-ion-list-item-height') ionItemHeight = new EventEmitter<number>();

    constructor(private elementRef: ElementRef, @Inject(WINDOW) private wndw: Window) {}

    ngOnInit() {
        interval(500)
            .pipe(
                flatMap(() => observableOf(this.getIonItemElement())),
                retry(),
                take(1),
            )
            .subscribe(ionItem => {
                this.ionItemHeight.emit(this.getIonItemHeight(ionItem));
            });
    }

    getIonItemElement() {
        const ionItem = this.elementRef.nativeElement.getElementsByTagName(this.itemTagName)[0] as HTMLElement;
        if (!ionItem) {
            throw new Error('No Item found');
        }
        return ionItem;
    }

    getIonItemHeight(ionItem: HTMLElement) {
        return (
            Math.round(parseFloat(this.wndw.getComputedStyle(ionItem).marginTop)) +
            Math.round(parseFloat(this.wndw.getComputedStyle(ionItem).marginBottom)) +
            Math.round(ionItem.getBoundingClientRect().height)
        );
    }
}
