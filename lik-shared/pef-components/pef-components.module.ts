import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { PefDetectIonListItemHeightDirective } from './pef-detect-ion-list-item-height/pef-detect-ion-list-item-height';
import { PefDialogOneButtonComponent } from './pef-dialog-one-button/pef-dialog-one-button';
import { PefDialogYesNoComponent } from './pef-dialog-yes-no/pef-dialog-yes-no';
import { PefDialogYesNoEditComponent } from './pef-dialog-yes-no-edit/pef-dialog-yes-no-edit';
import { PefDisableInputNumberBehaviourDirective } from './pef-disable-input-number-behaviour/pef-disable-input-number-behaviour';
import { PefFormatNumber } from './pef-format-number/pef-format-number';
import { PefFormatNumberPipe } from './pef-format-number-pipe/pef-format-number-pipe';
import { PefHighlightOnFocus } from './pef-highlight-on-focus/pef-highlight-on-focus';
import { PefIcon } from './pef-icon/pef-icon';
import { PefNoBreakString } from './pef-no-break-string-pipe/pef-no-break-string-pipe';
import { PefPerfectScrollbarDirective } from './pef-perfect-scrollbar/pef-perfect-scrollbar';
import { PefPerfectVirtualscrollScrollbarDirective } from './pef-perfect-virtualscroll-scrollbar/pef-perfect-virtualscroll-scrollbar';
import { PefSearchInput } from './pef-search-input/pef-search-input';
import { PefSvgIcons } from './pef-svg-icons/pef-svg-icons';
import { PefToggleButtonDirective } from './pef-toggle-button/pef-toggle-button';
import { PefVirtualScroll } from './pef-virtual-scroll/virtual-scroll';
import { PefVirtualFooter, PefVirtualItem, PefVirtualHeader } from './pef-virtual-scroll/virtual-item';

@NgModule({
    imports: [CommonModule, IonicModule, TranslateModule],
    declarations: [
        PefDetectIonListItemHeightDirective,
        PefDialogOneButtonComponent,
        PefDialogYesNoComponent,
        PefDialogYesNoEditComponent,
        PefDisableInputNumberBehaviourDirective,
        PefFormatNumber,
        PefFormatNumberPipe,
        PefHighlightOnFocus,
        PefIcon,
        PefNoBreakString,
        PefPerfectScrollbarDirective,
        PefPerfectVirtualscrollScrollbarDirective,
        PefSearchInput,
        PefSvgIcons,
        PefToggleButtonDirective,
        PefVirtualFooter,
        PefVirtualHeader,
        PefVirtualItem,
        PefVirtualScroll,
    ],
    entryComponents: [
        PefDialogOneButtonComponent,
        PefDialogYesNoComponent,
        PefDialogYesNoEditComponent,
    ],
    exports: [
        PefDetectIonListItemHeightDirective,
        PefDialogOneButtonComponent,
        PefDialogYesNoComponent,
        PefDialogYesNoEditComponent,
        PefDisableInputNumberBehaviourDirective,
        PefFormatNumber,
        PefFormatNumberPipe,
        PefHighlightOnFocus,
        PefIcon,
        PefNoBreakString,
        PefPerfectScrollbarDirective,
        PefPerfectVirtualscrollScrollbarDirective,
        PefSearchInput,
        PefSvgIcons,
        PefToggleButtonDirective,
        PefVirtualFooter,
        PefVirtualHeader,
        PefVirtualItem,
        PefVirtualScroll,
        TranslateModule
    ]
})
export class PefComponentsModule {
}
