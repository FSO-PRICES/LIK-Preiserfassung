import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from 'ng2-translate';

import { PefComponentsModule } from 'lik-shared';

import { DialogNewPmBearbeitungsCodeComponent } from './components/dialog-new-pm-bearbeitungs-code/dialog-new-pm-bearbeitungs-code';
import { PefDisableInputNegativeNumberDirective } from './pef-disable-input-negative-number';
import { PefFloatingIconDirective } from './pef-floating-icon/pef-floating-icon.ts';
import { PefMonthTranslatePipe } from './pipes/pef-month-translate-pipe';
import { PefPropertyTranslatePipe } from './pipes/pef-property-translate-pipe';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule, TranslateModule],
    declarations: [
        DialogNewPmBearbeitungsCodeComponent,
        PefDisableInputNegativeNumberDirective,
        PefFloatingIconDirective,
        PefMonthTranslatePipe,
        PefPropertyTranslatePipe,
    ],
    entryComponents: [
        DialogNewPmBearbeitungsCodeComponent,
    ],
    exports: [
        DialogNewPmBearbeitungsCodeComponent,
        PefDisableInputNegativeNumberDirective,
        PefFloatingIconDirective,
        PefMonthTranslatePipe,
        PefPropertyTranslatePipe,
    ]
})
export class PreiserfasserCommonModule {
}
