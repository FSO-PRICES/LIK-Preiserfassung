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
import { AfterViewInit, Component, EventEmitter, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription, defer, merge } from 'rxjs';
import {
    distinctUntilChanged,
    distinctUntilKeyChanged,
    filter,
    map,
    shareReplay,
    skip,
    startWith,
    switchMap,
    take,
} from 'rxjs/operators';

import { DialogCancelEditComponent, PefDialogService } from '@lik-shared';

import { Action as PreiserheberAction } from '../../actions/preiserheber';
import { CanDeactivate } from '../../guards/can-deactivate-guard';
import * as fromRoot from '../../reducers';
import { CurrentPreiserheber } from '../../reducers/preiserheber';

@Component({
    selector: 'preiserheber-page',
    templateUrl: 'pe-details.page.html',
    styleUrls: ['pe-details.page.scss'],
})
export class PeDetailsPage implements OnDestroy, AfterViewInit, CanDeactivate {
    public currentPreiserheber$ = this.store.select(fromRoot.getCurrentPreiserheber).pipe(skip(1));
    public languages$ = this.store
        .select(fromRoot.getLanguagesList)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    public distinctPreiserheber$: Observable<CurrentPreiserheber>;

    public cancelClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter<Event>();

    public showValidationHints$: Observable<boolean>;
    public canLeave$: Observable<boolean>;
    public allowToSave$: Observable<boolean>;

    public isCurrentModified$: Observable<boolean>;
    private cancelEditDialog$ = defer(() =>
        this.pefDialogService.displayDialog(DialogCancelEditComponent, { disableClose: true }),
    );

    public form: UntypedFormGroup;
    private subscriptions: Subscription[] = [];

    constructor(
        private router: Router,
        private store: Store<fromRoot.AppState>,
        private formBuilder: UntypedFormBuilder,
        private pefDialogService: PefDialogService,
    ) {
        this.allowToSave$ = this.currentPreiserheber$.pipe(map((x) => !!x && x.isModified && !x.isSaved));

        this.form = formBuilder.group({
            firstName: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
            surname: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
            telephone: [null],
            mobilephone: [null],
            email: [null],
            fax: [null],
            webseite: [null],
            languageCode: [null, Validators.required],
            street: [null],
            postcode: [null],
            town: [null],
            erhebungsregion: [null],
        });

        const update$ = this.form.valueChanges.pipe(map(() => this.form.value));

        this.distinctPreiserheber$ = this.currentPreiserheber$.pipe(
            filter((x) => !!x),
            distinctUntilKeyChanged('isModified'),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        const canSave$ = this.saveClicked$.pipe(
            map(() => ({ isValid: this.form.valid })),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        const save$ = canSave$.pipe(
            filter((x) => x.isValid),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.showValidationHints$ = canSave$.pipe(
            distinctUntilChanged(),
            map(() => true),
            startWith(false),
        );

        this.subscriptions = [
            this.cancelClicked$.subscribe(() => this.navigateToDashboard()),

            update$.subscribe((x) => store.dispatch({ type: 'UPDATE_PREISERHEBER', payload: x } as PreiserheberAction)),

            save$.subscribe(() => store.dispatch({ type: 'SAVE_PREISERHEBER' } as PreiserheberAction)),

            this.distinctPreiserheber$
                .pipe(filter((preiserheber) => !!preiserheber))
                .subscribe((erheber: CurrentPreiserheber) => {
                    this.form.markAsUntouched();
                    this.form.markAsPristine();
                    this.form.patchValue(
                        {
                            firstName: erheber.firstName,
                            surname: erheber.surname,
                            telephone: erheber.telephone,
                            mobilephone: erheber.mobilephone,
                            email: erheber.email,
                            fax: erheber.fax,
                            webseite: erheber.webseite,
                            languageCode: erheber.languageCode !== null ? erheber.languageCode : '',
                            street: erheber.street,
                            postcode: erheber.postcode,
                            town: erheber.town,
                            erhebungsregion: erheber.erhebungsregion,
                        },
                        { emitEvent: false },
                    );
                }),
        ];
    }

    public canDeactivate() {
        return merge(
            this.distinctPreiserheber$.pipe(
                filter((pe) => pe.isModified === false),
                map(() => true),
            ),
            this.distinctPreiserheber$.pipe(
                filter((pe) => pe.isModified === true),
                switchMap(() => this.cancelEditDialog$),
                map((dialogCode) => dialogCode === 'THROW_CHANGES'),
            ),
        ).pipe(take(1));
    }

    ngAfterViewInit() {
        this.store.dispatch({ type: 'LOAD_PREISERHEBER' } as PreiserheberAction);
    }

    ngOnDestroy() {
        this.subscriptions.filter((s) => !!s && !s.closed).forEach((s) => s.unsubscribe());
    }

    public navigateToDashboard() {
        return this.router.navigate(['/']);
    }
}
