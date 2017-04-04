import { Directive, HostListener, Renderer, ElementRef } from '@angular/core';

@Directive({
    selector: '[pef-disable-input-negative-number]',
})
export class PefDisableInputNegativeNumberDirective {
    private keydownListener: Function = null;

    constructor(private elementRef: ElementRef, private renderer: Renderer) {
    }

    @HostListener('focus')
    onFocus() {
        const inputElement = this.elementRef.nativeElement.getElementsByTagName('input')[0] as HTMLInputElement;
        this.keydownListener = this.renderer.listen(inputElement, 'keydown', (e: KeyboardEvent) => {
            if (e.key === '-') {
                e.preventDefault();
            }
        });
    }

    @HostListener('blur')
    onBlur() {
        if (!!this.keydownListener) {
            this.keydownListener();
            this.keydownListener = null;
        }
    }
}
