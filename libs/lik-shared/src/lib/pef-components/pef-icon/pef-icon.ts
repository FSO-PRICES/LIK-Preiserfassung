import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    standalone: true,
    selector: 'pef-icon',
    styleUrls: ['./pef-icon.scss'],
    template: `
        <svg [attr.class]="'pef-icon__' + name + ' ' + svgCssClasses">
            <use [attr.xlink:href]="'#' + name" />
        </svg>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PefIconComponent {
    @Input() name = '';
    @Input() svgCssClasses = '';
}
