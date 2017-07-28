import { NgModule } from '@angular/core';
import { DragulaModule } from 'ng2-dragula';
import { PmsSortPage } from './pms-sort';
import { IonicPageModule } from 'ionic-angular';
import { PefComponentsModule } from 'lik-shared';
import { PreiserfasserCommonModule } from '../../common/preiserfasser-common.module';

import { PmsSortComponent } from './pms-sort.component/pms-sort.component';

@NgModule({
    declarations: [
        PmsSortPage,
        PmsSortComponent
    ],
    imports: [
        DragulaModule,
        IonicPageModule.forChild(PmsSortPage),
        PefComponentsModule,
        PreiserfasserCommonModule
    ],
})
export class PmsSortPageModule { }
