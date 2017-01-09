import { Directive, ElementRef, Input } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Directive({
    selector: '[pef-toggle-button]',
    host: {
        '[class.toggled-on]': 'toggleOn'
    }
})
export class PefToggleButton {
    @Input() toggleOn: boolean = false;
}
