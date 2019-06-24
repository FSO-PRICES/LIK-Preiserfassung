import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PreiserheberPage } from './pe-details.page';

const routes: Routes = [
    {
        path: '',
        component: PreiserheberPage,
    },
];

@NgModule({
    imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
    declarations: [PreiserheberPage],
})
export class PeDetailsPageModule {}
