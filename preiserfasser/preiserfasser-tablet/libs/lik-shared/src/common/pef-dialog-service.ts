import { Injectable } from '@angular/core';
import { LoadingController, ModalController, PopoverController } from '@ionic/angular';
import { from, Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { PopoverOptions } from '@ionic/core';
import { InputP } from './dialog';

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
