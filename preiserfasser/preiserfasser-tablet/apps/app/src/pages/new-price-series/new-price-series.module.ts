import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule } from '@lik-shared';

import { DialogNewPmBearbeitungsCodeComponent } from '../../components/dialog-new-pm-bearbeitungs-code/dialog-new-pm-bearbeitungs-code.component';
import { ChooseFromWarenkorbComponent } from './choose-from-warenkorb';
import { NewPriceSeriesPage } from './new-price-series.page';

const routes: Routes = [
    {
        path: '',
        component: NewPriceSeriesPage,
    },
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PefComponentsModule,
        RouterModule.forChild(routes),
        TranslateModule,
    ],
    declarations: [NewPriceSeriesPage, ChooseFromWarenkorbComponent, DialogNewPmBearbeitungsCodeComponent],
})
export class NewPriceSeriesPageModule {}
