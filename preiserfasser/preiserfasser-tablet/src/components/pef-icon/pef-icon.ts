import { Component, Input } from '@angular/core';

@Component({
    selector: 'pef-icon',
    templateUrl: './pef-icon.html'
})
export class PefIcon {
    @Input() name: string;
    @Input() svgCssClasses: string = '';
}
