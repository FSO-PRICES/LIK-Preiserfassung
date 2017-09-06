import { NgModule } from '@angular/core';
import { PefDialogValidationErrorsComponent } from './pef-dialog-validation-errors/pef-dialog-validation-errors';
import { IonicPageModule } from 'ionic-angular';
import { PefComponentsModule } from './pef-components.module';

@NgModule({
    declarations: [PefDialogValidationErrorsComponent],
    entryComponents: [
        PefDialogValidationErrorsComponent
    ],
    imports: [
        IonicPageModule.forChild(PefDialogValidationErrorsComponent),
        PefComponentsModule
    ],
})
export class PefDialogValidationErrorsModule { }
