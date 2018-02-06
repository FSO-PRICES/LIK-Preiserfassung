import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
    selector: '[pefZoomable]',
})
export class PefZoomableDirective implements OnChanges {
    @Input() pefZoomable: number;

    constructor(private _elementRef: ElementRef) {
        _elementRef.nativeElement.style.transformOrigin = 'top left';
    }

    ngOnChanges() {
        this._elementRef.nativeElement.style.transform = `scale(${this.pefZoomable != null ? this.pefZoomable : 1})`;
    }
}
