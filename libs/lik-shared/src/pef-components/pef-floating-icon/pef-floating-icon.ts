import { Component, Input, ChangeDetectionStrategy, HostBinding } from '@angular/core';

@Component({
    selector: 'pef-floating-icon',
    styleUrls: ['./pef-floating-icon.scss'],
    template: `
        <pef-icon name="{{ iconName }}" [class.visibility-hidden]="!iconName"></pef-icon>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PefFloatingIconComponent {
    @Input('icon-name') iconName: string = null;
    @Input('bottom-right') @HostBinding('class.bottom-right') bottomRight = false;
}
