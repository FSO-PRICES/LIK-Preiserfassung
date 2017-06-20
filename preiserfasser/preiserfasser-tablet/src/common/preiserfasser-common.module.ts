import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule } from 'lik-shared';

import { PefDisableInputNegativeNumberDirective } from './pef-disable-input-negative-number';
import { PefVirtualScrollComponent } from './pef-virtual-scroll';
import { PefFloatingIconDirective } from './pef-floating-icon/pef-floating-icon';
import { PefMonthTranslatePipe } from './pipes/pef-month-translate-pipe';
import { PefPropertyTranslatePipe } from './pipes/pef-property-translate-pipe';

@NgModule({
    imports: [PefComponentsModule],
    declarations: [
        PefDisableInputNegativeNumberDirective,
        PefFloatingIconDirective,
        PefMonthTranslatePipe,
        PefPropertyTranslatePipe,
        PefVirtualScrollComponent
    ],
    exports: [
        PefDisableInputNegativeNumberDirective,
        PefFloatingIconDirective,
        PefMonthTranslatePipe,
        PefPropertyTranslatePipe,
        PefVirtualScrollComponent
    ]
})
export class PreiserfasserCommonModule {
}
