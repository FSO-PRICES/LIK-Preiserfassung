import { NgModule } from '@angular/core';
import { DashboardPage } from './dashboard';
import { IonicPageModule } from 'ionic-angular';
import { PefComponentsModule } from 'lik-shared';
import { PreiserfasserCommonModule } from '../../common/preiserfasser-common.module';
import { PmsPrintComponent } from '../pms-print/pms-print';

@NgModule({
    declarations: [
        DashboardPage,
        PmsPrintComponent
    ],
    imports: [
        IonicPageModule.forChild(DashboardPage),
        PefComponentsModule,
        PreiserfasserCommonModule
    ],
})
export class DashboardPageModule { }
