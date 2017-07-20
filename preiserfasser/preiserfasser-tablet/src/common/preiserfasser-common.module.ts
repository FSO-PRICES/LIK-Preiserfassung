import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule } from 'lik-shared';

import { PefDisableInputNegativeNumberDirective } from './pef-disable-input-negative-number';
import { PefFloatingIconDirective } from './pef-floating-icon/pef-floating-icon';
import { PefDateTranslatePipe } from './pipes/pef-date-translate-pipe';
import { PefMonthTranslatePipe } from './pipes/pef-month-translate-pipe';
import { PefPropertyTranslatePipe } from './pipes/pef-property-translate-pipe';

@NgModule({
    imports: [PefComponentsModule],
    declarations: [
        PefDisableInputNegativeNumberDirective,
        PefFloatingIconDirective,
        PefDateTranslatePipe,
        PefMonthTranslatePipe,
        PefPropertyTranslatePipe,
    ],
    exports: [
        PefDisableInputNegativeNumberDirective,
        PefFloatingIconDirective,
        PefDateTranslatePipe,
        PefMonthTranslatePipe,
        PefPropertyTranslatePipe
    ]
})
export class PreiserfasserCommonModule {
}
