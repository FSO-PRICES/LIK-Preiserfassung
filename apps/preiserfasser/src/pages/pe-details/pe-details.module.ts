import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule } from '@lik-shared';

import { PeDetailsPage } from './pe-details.page';

const routes: Routes = [
    {
        path: '',
        component: PeDetailsPage,
    },
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
        PefComponentsModule,
        IonicModule,
        RouterModule.forChild(routes),
    ],
    declarations: [PeDetailsPage],
})
export class PeDetailsPageModule {}
