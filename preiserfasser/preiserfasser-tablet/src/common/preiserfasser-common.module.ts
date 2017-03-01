import { NgModule } from '@angular/core';

import { PefMonthTranslatePipe } from './pipes/pef-month-translate-pipe';
import { PefPropertyTranslatePipe } from './pipes/pef-property-translate-pipe';

@NgModule({
    declarations: [
        PefMonthTranslatePipe,
        PefPropertyTranslatePipe,
    ],
    exports: [
        PefMonthTranslatePipe,
        PefPropertyTranslatePipe
    ]
})
export class PreiserfasserCommonModule {
}
