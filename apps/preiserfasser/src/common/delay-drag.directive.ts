import { Directive, ElementRef, EventEmitter, HostListener, Inject, Input, Output } from '@angular/core';
import { WINDOW } from 'ngx-window-token';
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Directive({
    selector: '[delay-drag]',
})
export class DelayDragDirective {
    @Input('delay-drag') public dragDelay: number;
    @Output('startDrag') public startDrag$ = new EventEmitter<MouseEvent | TouchEvent>();

    private touchTimeout: number;
    private clickPosition: { x: number; y: number };

    private onDestroy$ = new EventEmitter();
    private draggable = false;

    constructor(@Inject(WINDOW) private wndw: Window, elementRef: ElementRef) {
        fromEvent(elementRef.nativeElement, 'touchmove')
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(this.onTouchMove);
        fromEvent(elementRef.nativeElement, 'mousemove')
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(this.onMouseMove);
    }

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

    @HostListener('touchend', ['$event'])
    @HostListener('mouseup', ['$event'])
    public onMouseUpOrTouchEnd(evt: MouseEvent | TouchEvent): void {
        clearTimeout(this.touchTimeout);
        this.draggable = false;
    }

    public onTouchMove(evt: TouchEvent): void {
        if (!this.draggable) {
            evt.stopPropagation();
            clearTimeout(this.touchTimeout);
        }
    }
    public onMouseMove(evt: MouseEvent): void {
        if (!this.draggable && !samePosition(evt, this.clickPosition)) {
            clearTimeout(this.touchTimeout);
        }
    }

    public onDestroy() {
        this.onDestroy$.emit();
    }
}

function samePosition(evt: MouseEvent, lastPosition: { x: number; y: number }) {
    return !lastPosition || (evt.clientX === lastPosition.x && evt.clientY === lastPosition.y);
}
