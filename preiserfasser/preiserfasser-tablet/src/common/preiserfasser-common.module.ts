import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from 'ng2-translate';

import { PefComponentsModule } from 'lik-shared';

import { PefMonthTranslatePipe } from './pipes/pef-month-translate-pipe';
import { PefPropertyTranslatePipe } from './pipes/pef-property-translate-pipe';
import { DialogNewPmBearbeitungsCodeComponent } from './components/dialog-new-pm-bearbeitungs-code/dialog-new-pm-bearbeitungs-code';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule, TranslateModule],
    declarations: [
        PefMonthTranslatePipe,
        PefPropertyTranslatePipe,
        DialogNewPmBearbeitungsCodeComponent,
    ],
    entryComponents: [
        DialogNewPmBearbeitungsCodeComponent,
    ],
    exports: [
        PefMonthTranslatePipe,
        PefPropertyTranslatePipe,
        DialogNewPmBearbeitungsCodeComponent,
    ]
})
export class PreiserfasserCommonModule {
}
