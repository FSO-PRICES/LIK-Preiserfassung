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

import { Directive, EventEmitter, HostListener, Inject, Input, Output } from '@angular/core';
import { WINDOW } from 'ngx-window-token';

@Directive({
    selector: '[delay-drag]',
})
export class DelayDragDirective {
    @Input('delay-drag') public dragDelay: number;
    @Output('startDrag') public startDrag$ = new EventEmitter<MouseEvent | TouchEvent>();

    private touchTimeout: number;
    private clickPosition: { x: number; y: number };

    private draggable = false;

    constructor(@Inject(WINDOW) private wndw: Window) {}

    get delay() {
        return typeof this.dragDelay === 'number' ? this.dragDelay : 200;
    }

    @HostListener('touchstart', ['$event'])
    public onTouchStart(evt: TouchEvent): void {
        if (this.touchTimeout) {
            clearTimeout(this.touchTimeout);
        }
        if (evt.isTrusted) {
            this.touchTimeout = this.wndw.setTimeout(() => {
                this.startDrag$.emit(evt);
                this.draggable = true;
            }, this.delay);
        }
    }
    @HostListener('mousedown', ['$event'])
    public onMouseDown(evt: MouseEvent): void {
        this.clickPosition = { x: evt.clientX, y: evt.clientY };
        if (this.touchTimeout) {
            clearTimeout(this.touchTimeout);
        }
        if (evt.isTrusted) {
            this.touchTimeout = this.wndw.setTimeout(() => {
                this.startDrag$.emit(evt);
                this.draggable = true;
            }, this.delay);
        }
    }

    @HostListener('touchmove', ['$event'])
    public onTouchMove(evt: TouchEvent): void {
        if (!this.draggable) {
            evt.stopPropagation();
            clearTimeout(this.touchTimeout);
        }
    }
    @HostListener('mousemove', ['$event'])
    public onMouseMove(evt: MouseEvent): void {
        if (!this.draggable && !samePosition(evt, this.clickPosition)) {
            clearTimeout(this.touchTimeout);
        }
    }

    @HostListener('touchend', ['$event'])
    @HostListener('mouseup', ['$event'])
    public onMouseUpOrTouchEnd(evt): void {
        clearTimeout(this.touchTimeout);
        this.draggable = false;
    }
}

function samePosition(evt: MouseEvent, lastPosition: { x: number; y: number }) {
    return !lastPosition || (evt.clientX === lastPosition.x && evt.clientY === lastPosition.y);
}
