import { NgModule } from '@angular/core';
import { DialogNewPmBearbeitungsCodeComponent } from './dialog-new-pm-bearbeitungs-code';
import { IonicPageModule } from 'ionic-angular';
import { PefComponentsModule } from 'lik-shared';
import { PreiserfasserCommonModule } from '../../common/preiserfasser-common.module';

@NgModule({
    declarations: [
        DialogNewPmBearbeitungsCodeComponent,
    ],
    imports: [
        IonicPageModule.forChild(DialogNewPmBearbeitungsCodeComponent),
        PefComponentsModule,
        PreiserfasserCommonModule
    ]
})
export class DialogNewPmBearbeitungsCodeComponentModule { }
