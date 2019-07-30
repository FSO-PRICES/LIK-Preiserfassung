import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

@Component({
    selector: 'pef-item-wrapper',
    templateUrl: './pef-item-wrapper.html',
    styleUrls: ['./pef-item-wrapper.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PefItemWrapper {
    @Input() labelText: string;
    @Input() invalid = false;
    @HostBinding('class') classNames =
        'pef-item on-dark item md in-list ion-focusable hydrated item-label item-label-stacked item-interactive item-input';
    @Input() @HostBinding('class.on-dark') onDark = false;
}
