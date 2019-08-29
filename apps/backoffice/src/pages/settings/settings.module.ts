import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgxLetModule } from '@ngx-utilities/ngx-let';
import { NgxElectronModule } from 'ngx-electron';

import { PefComponentsModule } from '@lik-shared';

import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';
import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { SettingsPage } from './settings';

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        NgxElectronModule,
        NgxLetModule,
        ReactiveFormsModule,
        PefComponentsModule,
        PefDialogCancelEditModule,
        PefMenuModule,
    ],
    declarations: [SettingsPage],
})
export class SettingsModule {}
