import { Directive, HostListener, Input, ElementRef, OnInit } from '@angular/core';
import * as format from 'format-number';
import { isString, isObject } from 'lodash';

@Directive({
    selector: '[pef-format-number]'
})
export class PefFormatNumber implements OnInit {
    @Input('pef-format-number') formatOptions: string | Object;

    private el: HTMLInputElement;

    constructor(private elementRef: ElementRef) {
    }

    ngOnInit() {
        this.el = this.elementRef.nativeElement.getElementsByTagName('input')[0];
        setTimeout(() => this.formatElValue())
    }

    @HostListener('focus')
    onFocus() {
        // would unformat here, right now not implemented because formatting with a comma separator causes
        // <input type='number'> to barf, so right now all numbers are unformatted (without commas) all the time
    }

    @HostListener('blur')
    onBlur() {
        this.formatElValue();
    }

    @HostListener('ngModelChange', ['$event'])
    onChange(e) {
        if (this.el !== document.activeElement) setTimeout(() => this.formatElValue());
    }

    formatElValue() {
        this.el.value = format(this._formatOptions)(this.el.valueAsNumber);
    }

    get _formatOptions(): Object {
        if (isString(this.formatOptions)) return JSON.parse(this.formatOptions);
        if (isObject(this.formatOptions)) return this.formatOptions;
        return undefined;
    }
}
