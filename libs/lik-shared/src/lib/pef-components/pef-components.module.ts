import { A11yModule } from '@angular/cdk/a11y';
import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { PefDialogService } from '../common/pef-dialog-service';
import { PefMessageDialogService } from '../common/pef-message-dialog-service';

import { PefDateTranslatePipe } from './pef-date-translate-pipe/pef-date-translate-pipe';
import { PefDetectIonListItemHeightDirective } from './pef-detect-ion-list-item-height/pef-detect-ion-list-item-height';
import { PefDialogValidationErrorsComponent } from './pef-dialog-validation-errors/pef-dialog-validation-errors';
import { PefDisableEmojisDirective } from './pef-disable-emojis/pef-disable-emojis.directive';
import { PefDisableInputNumberBehaviourDirective } from './pef-disable-input-number-behaviour/pef-disable-input-number-behaviour';
import { PefFloatingIconComponent } from './pef-floating-icon/pef-floating-icon';
import { PefFormatNumber } from './pef-format-number/pef-format-number';
import { PefFormatNumberPipe } from './pef-format-number-pipe/pef-format-number-pipe';
import { PefHighlightOnFocus } from './pef-highlight-on-focus/pef-highlight-on-focus';
import { PefIconComponent } from './pef-icon/pef-icon';
import { PefMessageDialogComponent } from './pef-message-dialog/pef-message-dialog';
import { PefMonthTranslatePipe } from './pef-month-translate-pipe/pef-month-translate-pipe';
import { PefNoBreakString } from './pef-no-break-string-pipe/pef-no-break-string-pipe';
import { PefOnClickOutside } from './pef-on-click-outside/pef-on-click-outside';
import { PefPropertyTranslatePipe } from './pef-property-translate-pipe/pef-property-translate-pipe';
import { PefSearchInput } from './pef-search-input/pef-search-input';
import { PefSvgIcons } from './pef-svg-icons/pef-svg-icons';
import { PefToggleButtonComponent } from './pef-toggle-button/pef-toggle-button';

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        ReactiveFormsModule,
        TranslateModule,
        PefIconComponent,
        PefDialogValidationErrorsComponent,
        DialogModule,
        A11yModule,
    ],
    declarations: [
        PefDateTranslatePipe,
        PefDetectIonListItemHeightDirective,
        PefDisableInputNumberBehaviourDirective,
        PefDisableEmojisDirective,
        PefFloatingIconComponent,
        PefFormatNumber,
        PefFormatNumberPipe,
        PefHighlightOnFocus,
        PefMessageDialogComponent,
        PefMonthTranslatePipe,
        PefNoBreakString,
        PefOnClickOutside,
        PefPropertyTranslatePipe,
        PefSearchInput,
        PefSvgIcons,
        PefToggleButtonComponent,
    ],
    providers: [PefDialogService, PefMessageDialogService],
    exports: [
        PefDateTranslatePipe,
        PefDetectIonListItemHeightDirective,
        PefDialogValidationErrorsComponent,
        PefDisableInputNumberBehaviourDirective,
        PefDisableEmojisDirective,
        PefFloatingIconComponent,
        PefFormatNumber,
        PefFormatNumberPipe,
        PefHighlightOnFocus,
        PefIconComponent,
        PefMessageDialogComponent,
        PefMonthTranslatePipe,
        PefNoBreakString,
        PefOnClickOutside,
        PefPropertyTranslatePipe,
        PefSearchInput,
        PefSvgIcons,
        PefToggleButtonComponent,
        TranslateModule,
    ],
})
export class PefComponentsModule {}
