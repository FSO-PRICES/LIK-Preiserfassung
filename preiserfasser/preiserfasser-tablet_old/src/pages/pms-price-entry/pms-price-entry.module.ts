import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { PreiserfasserCommonModule } from '../../common';
import { PefComponentsModule, PreismeldungSharedModule } from 'lik-shared';
import { PreismeldungListComponent } from './components/preismeldung-list/preismeldung-list';

import { PmsPriceEntryPage } from './pms-price-entry';

@NgModule({
    imports: [
        IonicPageModule.forChild(PmsPriceEntryPage),
        PefComponentsModule,
        PreiserfasserCommonModule,
        PreismeldungSharedModule
    ],
    declarations: [
        PreismeldungListComponent,
        PmsPriceEntryPage,
    ],
    providers: [
        { provide: 'windowObject', useValue: window }
    ],
    exports: [
        PmsPriceEntryPage
    ]
})
export class PmsPriceEntryModule {
}
