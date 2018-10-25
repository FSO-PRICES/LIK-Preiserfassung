/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { PefDateTranslatePipe } from './pef-date-translate-pipe/pef-date-translate-pipe';
import { PefDetectIonListItemHeightDirective } from './pef-detect-ion-list-item-height/pef-detect-ion-list-item-height';
import { PefDialogValidationErrorsComponent } from './pef-dialog-validation-errors/pef-dialog-validation-errors';
import { PefDisableInputNumberBehaviourDirective } from './pef-disable-input-number-behaviour/pef-disable-input-number-behaviour';
import { PefFloatingIconComponent } from './pef-floating-icon/pef-floating-icon';
import { PefFormatNumber } from './pef-format-number/pef-format-number';
import { PefFormatNumberPipe } from './pef-format-number-pipe/pef-format-number-pipe';
import { PefHighlightOnFocus } from './pef-highlight-on-focus/pef-highlight-on-focus';
import { PefIcon } from './pef-icon/pef-icon';
import { PefMessageDialogComponent } from './pef-message-dialog/pef-message-dialog';
import { PefMonthTranslatePipe } from './pef-month-translate-pipe/pef-month-translate-pipe';
import { PefNoBreakString } from './pef-no-break-string-pipe/pef-no-break-string-pipe';
import { PefPerfectScrollbarDirective } from './pef-perfect-scrollbar/pef-perfect-scrollbar';
import { PefPerfectVirtualscrollScrollbarDirective } from './pef-perfect-virtualscroll-scrollbar/pef-perfect-virtualscroll-scrollbar';
import { PefPropertyTranslatePipe } from './pef-property-translate-pipe/pef-property-translate-pipe';
import { PefSearchInput } from './pef-search-input/pef-search-input';
import { PefSvgIcons } from './pef-svg-icons/pef-svg-icons';
import { PefToggleButtonDirective } from './pef-toggle-button/pef-toggle-button';
import { PefVirtualScrollComponent } from './pef-virtual-scroll/pef-virtual-scroll';

@NgModule({
    imports: [CommonModule, IonicModule, TranslateModule],
    declarations: [
        PefDateTranslatePipe,
        PefDetectIonListItemHeightDirective,
        PefDialogValidationErrorsComponent,
        PefDisableInputNumberBehaviourDirective,
        PefFloatingIconComponent,
        PefFormatNumber,
        PefFormatNumberPipe,
        PefHighlightOnFocus,
        PefIcon,
        PefMessageDialogComponent,
        PefMonthTranslatePipe,
        PefNoBreakString,
        PefPerfectScrollbarDirective,
        PefPerfectVirtualscrollScrollbarDirective,
        PefPropertyTranslatePipe,
        PefSearchInput,
        PefSvgIcons,
        PefToggleButtonDirective,
        PefVirtualScrollComponent,
    ],
    entryComponents: [
        PefDialogValidationErrorsComponent,
        PefMessageDialogComponent
    ],
    exports: [
        PefDateTranslatePipe,
        PefDetectIonListItemHeightDirective,
        PefDialogValidationErrorsComponent,
        PefDisableInputNumberBehaviourDirective,
        PefFloatingIconComponent,
        PefFormatNumber,
        PefFormatNumberPipe,
        PefHighlightOnFocus,
        PefIcon,
        PefMessageDialogComponent,
        PefMonthTranslatePipe,
        PefNoBreakString,
        PefPerfectScrollbarDirective,
        PefPerfectVirtualscrollScrollbarDirective,
        PefPropertyTranslatePipe,
        PefSearchInput,
        PefSvgIcons,
        PefToggleButtonDirective,
        PefVirtualScrollComponent,
        TranslateModule
    ]
})
export class PefComponentsModule {
}
