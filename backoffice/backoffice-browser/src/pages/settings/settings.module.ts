import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { SettingsPage } from './settings';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

@NgModule({
    declarations: [
        SettingsPage
    ],
    imports: [
        IonicPageModule.forChild(SettingsPage),
        PefMenuModule
    ],
})
export class SettingsModule {
}
