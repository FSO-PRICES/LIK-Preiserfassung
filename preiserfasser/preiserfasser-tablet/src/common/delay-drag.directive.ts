import { Directive, HostListener, Input, HostBinding, ElementRef } from '@angular/core';

@Directive({
    selector: '[delay-drag]',
})
export class DelayDragDirective {
    @Input('delay-drag') public dragDelay: number;

    private touchTimeout: number;

    @HostBinding('class.delay-drag-lifted') private draggable: boolean = false;

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
        this.touchTimeout = window.setTimeout(() => {
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
