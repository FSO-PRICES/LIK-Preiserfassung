import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PmsSortPage } from './pms-sort.page';

const routes: Routes = [
    {
        path: '',
        component: PmsSortPage,
    },
];

@NgModule({
    imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
    declarations: [PmsSortPage],
})
export class PmsSortPageModule {}
