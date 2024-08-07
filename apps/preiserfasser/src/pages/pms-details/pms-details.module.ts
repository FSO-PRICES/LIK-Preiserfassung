import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule } from '@lik-shared';

import { PmsDetailsPage } from './pms-details.page';

const routes: Routes = [
    {
        path: '',
        component: PmsDetailsPage,
    },
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule,
        TranslateModule,
        PefComponentsModule,
        RouterModule.forChild(routes),
    ],
    declarations: [PmsDetailsPage],
})
export class PmsDetailsPageModule {}
