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

import { Directive, ElementRef, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';

@Directive({
    selector: '[pef-detect-ion-list-item-height]',
})
export class PefDetectIonListItemHeightDirective implements OnInit {
    @Output('pef-detect-ion-list-item-height') ionItemHeight = new EventEmitter<number>();

    constructor(private elementRef: ElementRef, @Inject('windowObject') private window: any) {
    }

    ngOnInit() {
        Observable.interval(500)
            .flatMap(() => Observable.of(this.getIonItemElement()))
            .retry()
            .take(1)
            .subscribe(ionItem => {
                this.ionItemHeight.emit(this.getIonItemHeight(ionItem));
            });
    }

    getIonItemElement() {
        const ionItem = this.elementRef.nativeElement.getElementsByTagName('ion-item')[0] as HTMLElement;
        if (!ionItem) {
            throw new Error('No Item found');
        }
        return ionItem;
    }

    getIonItemHeight(ionItem: HTMLElement) {
        return Math.round(parseFloat(this.window.getComputedStyle(ionItem).marginTop))
            + Math.round(parseFloat(this.window.getComputedStyle(ionItem).marginBottom))
            + Math.round(ionItem.getBoundingClientRect().height);
    }
}
