import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { SettingsPage } from './settings';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';
import { PefComponentsModule } from 'lik-shared';

@NgModule({
    declarations: [SettingsPage],
    imports: [IonicPageModule.forChild(SettingsPage), PefComponentsModule, PefDialogCancelEditModule, PefMenuModule],
})
export class SettingsModule {}
