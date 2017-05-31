import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PefComponentsModule } from 'lik-shared';
import { PreiserfasserCommonModule } from '../../common/preiserfasser-common.module';

import { SettingsPage } from './settings';

@NgModule({
    declarations: [SettingsPage],
    imports: [
        IonicPageModule.forChild(SettingsPage),
        PefComponentsModule,
        PreiserfasserCommonModule
    ]
})
export class SettingsModule {
}
