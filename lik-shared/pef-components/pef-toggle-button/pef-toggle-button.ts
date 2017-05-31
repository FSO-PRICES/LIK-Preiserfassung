import { Directive, Input, HostBinding } from '@angular/core';

@Directive({
    selector: '[pef-toggle-button]',
})
export class PefToggleButtonDirective {
    @Input() @HostBinding('class.toggled-on') toggleOn = false;
}
