import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { PefComponentsModule, PreismeldungSharedModule } from '@lik-shared';

import { PreismeldungListComponent } from './components/preismeldung-list/preismeldung-list';
import { PmsPriceEntryPage } from './pms-price-entry.page';

const routes: Routes = [
    {
        path: '',
        component: PmsPriceEntryPage,
    },
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PefComponentsModule,
        PreismeldungSharedModule,
        RouterModule.forChild(routes),
    ],
    declarations: [PmsPriceEntryPage, PreismeldungListComponent],
})
export class PmsPriceEntryPageModule {}