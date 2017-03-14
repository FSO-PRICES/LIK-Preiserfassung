import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular';
import { PefDialogLoginComponent } from './pef-dialog-login';

import { PefComponentsModule } from 'lik-shared';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule],
    declarations: [
        PefDialogLoginComponent
    ],
    entryComponents: [
        PefDialogLoginComponent
    ],
    exports: [PefDialogLoginComponent]
})
export class PefDialogLoginModule {
}
