/*
 * LIK-Preiserfassung
 * Copyright (C) 2024 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
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
import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { PopoverOptions } from '@ionic/core';
import { Observable, from } from 'rxjs';
import { shareReplay, switchMap, take } from 'rxjs/operators';

import { StronglyTypedDialog } from '../pef-components';

type TextDialogOptions = {
    requestDismiss$?: Observable<unknown>;
    dialogOptions?: Omit<PopoverOptions, 'component' | 'componentProps'>;
};

@Injectable()
export class PefDialogService {
    constructor(private loadingController: LoadingController, private dialog: Dialog) {}

    displayDialog<D, R, DisableClose extends boolean = false>(
        component: ComponentType<StronglyTypedDialog<D, R>>,
        config?: DialogConfig<D, DialogRef<R, StronglyTypedDialog<D, R>>> & { disableClose: DisableClose },
    ): Observable<DisableClose extends true ? R : R | undefined> {
        const dialogRef = this.dialog.open<R, D, StronglyTypedDialog<D, R>>(component, config);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return dialogRef.closed as any;
    }

    displayLoading(text: string, options: TextDialogOptions = {}) {
        const { requestDismiss$, dialogOptions } = { requestDismiss$: null, dialogOptions: null, ...options };
        const loader$ = from(
            this.loadingController.create({
                message: text,
                ...dialogOptions,
            }),
        ).pipe(
            switchMap((dialog) => dialog.present().then(() => dialog)),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
        loader$.pipe(take(1)).subscribe();
        if (requestDismiss$ !== null) {
            requestDismiss$
                .pipe(
                    take(1),
                    switchMap(() => loader$),
                )
                .subscribe((loader) => loader.dismiss());
        }
        return loader$;
    }
}
