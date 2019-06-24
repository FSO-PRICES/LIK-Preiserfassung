import { NgModule } from '@angular/core';
import { DashboardPage } from './dashboard';
import { IonicPageModule } from 'ionic-angular';
import { PefComponentsModule } from 'lik-shared';
import { PreiserfasserCommonModule } from '../../common/preiserfasser-common.module';

@NgModule({
    declarations: [
        DashboardPage,
    ],
    imports: [
        IonicPageModule.forChild(DashboardPage),
        PefComponentsModule,
        PreiserfasserCommonModule
    ],
})
export class DashboardPageModule { }
