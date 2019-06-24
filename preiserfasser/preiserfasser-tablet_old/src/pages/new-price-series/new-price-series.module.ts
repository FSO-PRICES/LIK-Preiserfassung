import { NgModule } from '@angular/core';
import { NewPriceSeriesPage } from './new-price-series';
import { IonicPageModule } from 'ionic-angular';
import { PefComponentsModule } from 'lik-shared';
import { PreiserfasserCommonModule } from '../../common/preiserfasser-common.module';
import { ChooseFromWarenkorbComponent } from './choose-from-warenkorb'

@NgModule({
    declarations: [
        NewPriceSeriesPage,
        ChooseFromWarenkorbComponent
    ],
    imports: [
        IonicPageModule.forChild(NewPriceSeriesPage),
        PefComponentsModule,
        PreiserfasserCommonModule
    ]
})
export class NewPriceSeriesPageModule { }
