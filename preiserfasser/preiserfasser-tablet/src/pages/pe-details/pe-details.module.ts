import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PefComponentsModule } from 'lik-shared';
import { PreiserfasserCommonModule } from '../../common/preiserfasser-common.module';

import { PreiserheberPage } from './pe-details';

@NgModule({
    declarations: [PreiserheberPage],
    imports: [
        IonicPageModule.forChild(PreiserheberPage),
        PefComponentsModule,
        PreiserfasserCommonModule
    ]
})
export class PreiserheberModule {
}
