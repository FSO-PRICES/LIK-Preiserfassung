import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { SettingsPage } from './settings';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';

@NgModule({
    declarations: [
        SettingsPage
    ],
    imports: [
        IonicPageModule.forChild(SettingsPage),
        PefDialogCancelEditModule,
        PefMenuModule
    ],
})
export class SettingsModule {
}
