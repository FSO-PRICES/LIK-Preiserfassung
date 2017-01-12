import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';

import { PefDialogWrapper } from './pef-dialog-wrapper/pef-dialog-wrapper';
import { PefFormatNumber } from './pef-format-number/pef-format-number';
import { PefFormatNumberPipe } from './pef-format-number-pipe/pef-format-number-pipe';
import { PefHighlightOnFocus } from './pef-highlight-on-focus/pef-highlight-on-focus';
import { PefIcon } from './pef-icon/pef-icon';
import { PefPerfectScrollbar } from './pef-perfect-scrollbar/pef-perfect-scrollbar';
import { PefSearchInput } from './pef-search-input/pef-search-input';
import { PefSvgIcons } from './pef-svg-icons/pef-svg-icons';
import { PefToggleButton } from './pef-toggle-button/pef-toggle-button';
import { PefVirtualScrollComponent } from './pef-virtual-scroll/pef-virtual-scroll';

@NgModule({
    imports: [CommonModule, IonicModule],
    declarations: [
        PefDialogWrapper,
        PefFormatNumber,
        PefFormatNumberPipe,
        PefHighlightOnFocus,
        PefIcon,
        PefPerfectScrollbar,
        PefSearchInput,
        PefSvgIcons,
        PefToggleButton,
        PefVirtualScrollComponent
    ],
    exports: [
        PefDialogWrapper,
        PefFormatNumber,
        PefFormatNumberPipe,
        PefHighlightOnFocus,
        PefIcon,
        PefPerfectScrollbar,
        PefSearchInput,
        PefSvgIcons,
        PefToggleButton,
        PefVirtualScrollComponent
    ]
})
export class PefComponentsModule {
}
