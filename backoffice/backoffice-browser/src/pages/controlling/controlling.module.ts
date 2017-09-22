import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { ControllingPage } from './controlling';
import { ControllingReportComponent } from './controlling-report/controlling-report';
import { StichtageComponent } from './stichtage/stichtage';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

@NgModule({
    declarations: [
        ControllingPage,
        StichtageComponent,
        ControllingReportComponent
    ],
    imports: [
        IonicPageModule.forChild(ControllingPage),
        PefMenuModule
    ],
})
export class ControllingModule {
}
