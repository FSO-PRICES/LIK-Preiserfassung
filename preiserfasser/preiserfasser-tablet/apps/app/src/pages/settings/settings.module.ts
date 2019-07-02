import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule } from '@lik-shared';

import { SettingsPage } from './settings.page';

const routes: Routes = [
    {
        path: '',
        component: SettingsPage,
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
    declarations: [SettingsPage],
})
export class SettingsPageModule {}
