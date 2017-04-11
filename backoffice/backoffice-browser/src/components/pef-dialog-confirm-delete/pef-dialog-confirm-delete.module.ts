import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular';
import { PefDialogConfirmDeleteComponent } from './pef-dialog-confirm-delete';

import { PefComponentsModule } from 'lik-shared';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule],
    declarations: [
        PefDialogConfirmDeleteComponent
    ],
    entryComponents: [
        PefDialogConfirmDeleteComponent
    ],
    exports: [PefDialogConfirmDeleteComponent]
})
export class PefDialogConfirmDeleteModule {
}
