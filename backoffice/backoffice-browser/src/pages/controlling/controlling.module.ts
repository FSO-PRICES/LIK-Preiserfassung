import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { ControllingPage } from './controlling';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

@NgModule({
    declarations: [
        ControllingPage,
    ],
    imports: [
        IonicPageModule.forChild(ControllingPage),
        PefMenuModule
    ],
})
export class ControllingModule {
}
