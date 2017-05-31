import { NgModule } from '@angular/core';
import { PmsDetailsPage } from './pms-details';
import { IonicPageModule } from 'ionic-angular';
import { PefComponentsModule } from 'lik-shared';
import { PreiserfasserCommonModule } from '../../common/preiserfasser-common.module';

@NgModule({
    declarations: [
        PmsDetailsPage
    ],
    imports: [
        IonicPageModule.forChild(PmsDetailsPage),
        PefComponentsModule,
        PreiserfasserCommonModule
    ],
})
export class PmsDetailsPageModule { }
