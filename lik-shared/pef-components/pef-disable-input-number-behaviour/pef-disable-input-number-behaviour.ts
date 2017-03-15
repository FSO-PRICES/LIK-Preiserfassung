import { Directive, HostListener, Renderer, ElementRef } from '@angular/core';

@Directive({
    selector: '[pef-disable-input-number-behaviour]',
})
export class PefDisableInputNumberBehaviourDirective {
    private mousewheelDisableScrollListener: Function = null;
    private keydownListener: Function = null;

    constructor(private elementRef: ElementRef, private renderer: Renderer) {
    }

    @HostListener('focus')
    onFocus() {
        const inputElement = this.elementRef.nativeElement.getElementsByTagName('input')[0] as HTMLInputElement;
        this.mousewheelDisableScrollListener = this.renderer.listen(inputElement, 'mousewheel', (e: Event) => {
            e.preventDefault();
        });
        this.keydownListener = this.renderer.listen(inputElement, 'keydown', (e: KeyboardEvent) => {
            if (e.which === 38 || e.which === 40) {
                e.preventDefault();
            }
        });
    }

    @HostListener('blur')
    onBlur() {
        if (!!this.mousewheelDisableScrollListener) {
            this.mousewheelDisableScrollListener();
            this.mousewheelDisableScrollListener = null;
            this.keydownListener();
            this.keydownListener = null;
        }
    }
}
