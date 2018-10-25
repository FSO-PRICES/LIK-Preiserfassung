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

import { Directive, HostListener, Input, HostBinding, ElementRef, Inject } from '@angular/core';

@Directive({
    selector: '[delay-drag]',
})
export class DelayDragDirective {
    @Input('delay-drag') public dragDelay: number;

    private touchTimeout: number;

    @HostBinding('class.delay-drag-lifted') private draggable: boolean = false;

    constructor(@Inject('windowObject') private window: any) {}

    // private get draggable(): boolean {
    //     return this.el.nativeElement.draggable;
    // }
    // private set draggable(value: boolean) {
    //     this.el.nativeElement.draggable = value;
    // }

    get delay() {
        return typeof this.dragDelay === 'number' ? this.dragDelay : 200;
    }

    @HostListener('touchstart', ['$event'])
    private onTouchStart(evt: Event): void {
        console.log('onTouchStart');
        if (this.touchTimeout) {
            clearTimeout(this.touchTimeout);
        }
        this.touchTimeout = this.window.setTimeout(() => {
            // console.log('setting draggable = true');
            this.draggable = true;
            // this.setDraggable(true);
        }, this.delay);
    }

    @HostListener('touchmove', ['$event'])
    private onTouchMove(evt: Event): void {
        if (!this.draggable) {
            evt.stopPropagation();
            clearTimeout(this.touchTimeout);
        }
    }

    @HostListener('touchend', ['$event'])
    private onTouchEnd(evt: Event): void {
        clearTimeout(this.touchTimeout);
        // console.log('setting draggable = false');
        this.draggable = false;
        // this.setDraggable(false);
    }

    // private setDraggable(value: boolean) {
    //     this.draggable = value;
    //     // this.el.nativeElement.draggable = value;
    // }
}
