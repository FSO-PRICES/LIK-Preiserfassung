import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular';

import { SettingsPage } from './settings';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

@NgModule({
    imports: [CommonModule, IonicModule, PefMenuModule],
    declarations: [
        SettingsPage
    ],
    entryComponents: [
    ],
    exports: [SettingsPage]
})
export class SettingsModule {
}
