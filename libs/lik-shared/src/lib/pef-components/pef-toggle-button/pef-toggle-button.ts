import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

@Component({
    selector: 'pef-toggle-button',
    styleUrls: ['./pef-toggle-button.scss'],
    template: '<ng-content></ng-content>',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PefToggleButtonComponent {
    @Input() @HostBinding('class.toggled-on') toggleOn = false;
}
