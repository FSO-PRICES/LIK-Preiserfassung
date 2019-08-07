import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'pef-icon',
    styleUrls: ['./pef-icon.scss'],
    template: `
        <svg [attr.class]="'pef-icon__' + name + ' ' + svgCssClasses">
            <use [attr.xlink:href]="'#' + name" />
        </svg>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PefIcon {
    @Input() name: string;
    @Input() svgCssClasses: string = '';
}
