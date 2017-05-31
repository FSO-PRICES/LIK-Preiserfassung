import { NgModule } from '@angular/core';
import { LoginModal } from './login';
import { IonicPageModule } from 'ionic-angular';
import { PefComponentsModule } from 'lik-shared';

@NgModule({
    declarations: [LoginModal],
    imports: [
        IonicPageModule.forChild(LoginModal),
        PefComponentsModule
    ],
})
export class LoginModalModule { }
