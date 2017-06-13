import { Component, Input, ChangeDetectionStrategy, OnChanges, SimpleChange, HostBinding } from '@angular/core';

@Component({
    selector: 'pef-floating-icon',
    template: `<pef-icon name="{{iconName}}" [class.visibility-hidden]="!iconName"></pef-icon>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PefFloatingIconDirective {
    @Input('icon-name') iconName: string = null;
    @Input('bottom-right') @HostBinding('class.bottom-right') bottomRight = false;
}
