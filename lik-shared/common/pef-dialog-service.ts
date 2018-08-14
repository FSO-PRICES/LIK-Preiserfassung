/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { Component, Injectable } from '@angular/core';
import { PopoverController, ModalController, LoadingController } from 'ionic-angular';
import { Observable } from 'rxjs';

export interface DialogOptions {
    params?: any;
    enableBackdropDismiss?: boolean;
    requestDismiss$?: Observable<{}>;
}

const defaultOptions: DialogOptions = {
    params: null,
    enableBackdropDismiss: false,
    requestDismiss$: null
};

@Injectable()
export class PefDialogService {
    constructor(private popoverController: PopoverController, private modalController: ModalController, private loadingController: LoadingController) { }

    displayDialog(dialogComponent: Component, params: any, enableBackdropDismiss = false, requestDismiss$: Observable<{}> = null) {
        const dialog = this.popoverController.create(dialogComponent, { params }, { enableBackdropDismiss });
        dialog.present();
        if (requestDismiss$ !== null) {
            requestDismiss$.take(1).subscribe(() => dialog.dismiss());
        }
        return Observable.bindCallback<any[]>(cb => dialog.onWillDismiss(cb))()
            .map(([data, role]) => ({ data, role }));
    }

    displayModal(dialogComponent: Component, options: DialogOptions = defaultOptions) {
        const dialog = this.modalController.create(dialogComponent, { params: options.params }, { enableBackdropDismiss: options.enableBackdropDismiss });
        dialog.present();
        if (options.requestDismiss$ !== null) {
            options.requestDismiss$.take(1).subscribe(() => dialog.dismiss());
        }
        return Observable.bindCallback<any[]>(cb => dialog.onWillDismiss(cb))()
            .map(([data, role]) => ({ data, role }));
    }

    displayLoading(text: string, requestDismiss$: Observable<{}>) {
        const loader = this.loadingController.create({
            content: text
        });
        if (requestDismiss$ !== null) {
            requestDismiss$.take(1).subscribe(() => loader.dismiss());
        }
        return Observable.fromPromise(loader.present());
    }
}
