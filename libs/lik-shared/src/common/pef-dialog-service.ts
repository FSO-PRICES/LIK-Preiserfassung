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

import { Injectable } from '@angular/core';
import { LoadingController, ModalController, PopoverController } from '@ionic/angular';
import { from, Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { PopoverOptions } from '@ionic/core';
import { InputP } from './dialog';

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

type Class<T extends Function> = T['prototype'];
type TextDialogOptions = {
    requestDismiss$?: Observable<{}>;
    dialogOptions?: Omit<PopoverOptions, 'component' | 'componentProps'>;
};
type DialogOptions<T extends Function, K extends keyof Class<T>> = {
    params?: { [P in K]: Class<T>[P] extends InputP<unknown> ? Class<T>[P] : never };
    requestDismiss$?: Observable<{}>;
    dialogOptions?: Omit<PopoverOptions, 'component' | 'componentProps'>;
};

@Injectable()
export class PefDialogService {
    constructor(
        private popoverController: PopoverController,
        private modalController: ModalController,
        private loadingController: LoadingController,
    ) {}

    displayDialog<T extends Function, K extends keyof Class<T>>(dialogComponent: T, options: DialogOptions<T, K> = {}) {
        const { params, requestDismiss$, dialogOptions } = {
            requestDismiss$: null,
            params: {},
            dialogOptions: null,
            ...options,
        };
        const dialog$ = from(
            this.popoverController.create({
                component: dialogComponent,
                componentProps: params,
                backdropDismiss: false,
                ...dialogOptions,
            }),
        ).pipe(switchMap(dialog => dialog.present().then(() => dialog)));
        if (requestDismiss$ !== null) {
            requestDismiss$
                .pipe(
                    take(1),
                    switchMap(() => dialog$),
                )
                .subscribe(dialog => dialog.dismiss());
        }
        return dialog$.pipe(switchMap(dialog => dialog.onWillDismiss()));
    }

    displayModal<T extends Function, K extends keyof Class<T>>(component: T, options: DialogOptions<T, K> = {}) {
        const { params, requestDismiss$, dialogOptions } = {
            requestDismiss$: null,
            params: {},
            dialogOptions: null,
            ...options,
        };
        const dialog$ = from(
            this.modalController.create({
                component: component,
                componentProps: params,
                ...dialogOptions,
            }),
        ).pipe(switchMap(dialog => dialog.present().then(() => dialog)));
        if (requestDismiss$ !== null) {
            requestDismiss$
                .pipe(
                    take(1),
                    switchMap(() => dialog$),
                )
                .subscribe(dialog => dialog.dismiss());
        }
        return dialog$.pipe(switchMap(dialog => dialog.onWillDismiss()));
    }

    displayLoading(text: string, options: TextDialogOptions = {}) {
        const { requestDismiss$, dialogOptions } = { requestDismiss$: null, dialogOptions: null, ...options };
        const loader$ = from(
            this.loadingController.create({
                message: text,
                ...dialogOptions,
            }),
        ).pipe(switchMap(dialog => dialog.present().then(() => dialog)));
        if (requestDismiss$ !== null) {
            requestDismiss$
                .pipe(
                    take(1),
                    switchMap(() => loader$),
                )
                .subscribe(loader => loader.dismiss());
        }
        return loader$;
    }
}
