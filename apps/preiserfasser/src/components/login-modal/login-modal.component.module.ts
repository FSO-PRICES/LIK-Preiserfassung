import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { PefComponentsModule } from '@lik-shared';

import { LoginModalComponent } from './login-modal.component';

@NgModule({
    declarations: [LoginModalComponent],
    imports: [FormsModule, ReactiveFormsModule, IonicModule, PefComponentsModule, RouterModule],
})
export class LoginModalComponentModule {}
