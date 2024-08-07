import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { NgxLetModule, PefComponentsModule } from '@lik-shared';

import { LoginModalComponentModule } from '../../components/login-modal';

import { DashboardPage } from './dashboard.page';

const routes: Routes = [
    {
        path: '',
        component: DashboardPage,
    },
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        TranslateModule,
        NgxLetModule,
        PefComponentsModule,
        LoginModalComponentModule,
        RouterModule.forChild(routes),
    ],
    declarations: [DashboardPage],
})
export class DashboardPageModule {}
