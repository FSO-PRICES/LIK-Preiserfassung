import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { PefComponentsModule } from '@lik-shared';

import { LoginModalComponent } from './login-modal.component';

@NgModule({
    entryComponents: [LoginModalComponent],
    declarations: [LoginModalComponent],
    imports: [FormsModule, ReactiveFormsModule, IonicModule, PefComponentsModule],
})
export class LoginModalComponentModule {}
