import { Directive, Input } from '@angular/core';

@Directive({
    selector: '[pef-toggle-button]',
    host: {
        '[class.toggled-on]': 'toggleOn'
    }
})
export class PefToggleButton {
    @Input() toggleOn: boolean = false;
}
