import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { PefComponentsModule, PreismeldungSharedModule } from '@lik-shared';

import { PreiserfasserCommonModule } from '../../common';

import { PreismeldungListComponent } from './components/preismeldung-list/preismeldung-list';
import { PmsPriceEntryPage } from './pms-price-entry.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PefComponentsModule,
        PreiserfasserCommonModule,
        PreismeldungSharedModule,
        ScrollingModule,
    ],
    declarations: [PmsPriceEntryPage, PreismeldungListComponent],
})
export class PmsPriceEntryPageModule {}
