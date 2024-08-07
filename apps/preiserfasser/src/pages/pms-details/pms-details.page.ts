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
import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { assign, range } from 'lodash';
import { Observable, Subscription, combineLatest, defer, merge, of } from 'rxjs';
import {
    distinctUntilChanged,
    distinctUntilKeyChanged,
    filter,
    map,
    mergeWith,
    scan,
    shareReplay,
    switchMap,
    take,
} from 'rxjs/operators';

import { DialogCancelEditComponent, PefDialogService } from '@lik-shared';
import { Models as P, encodeErhebungsartFromForm, parseErhebungsarten } from '@lik-shared';

import { Actions as preismeldestellenAction } from '../../actions/preismeldestellen';
import { CanDeactivate } from '../../guards/can-deactivate-guard';
import * as fromRoot from '../../reducers';
import { CurrentPreismeldestelle } from '../../reducers/preismeldestellen';

@Component({
    selector: 'pms-details',
    templateUrl: 'pms-details.page.html',
    styleUrls: ['pms-details.page.scss'],
})
export class PmsDetailsPage implements OnDestroy, CanDeactivate {
    public isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    public pms$ = this.store.select(fromRoot.getCurrentPreismeldestelle);
    public languages$ = this.store.select(fromRoot.getLanguagesList);
    public distinctPreismeldestelle$: Observable<CurrentPreismeldestelle>;

    public pmsGeschlossenClicked$ = new EventEmitter<void>();
    public formErrors$: Observable<string[]>;
    public hasErrors$: Observable<boolean>;

    public cancelClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter();
    public showValidationHints$: Observable<boolean>;

    public isCurrentModified$: Observable<boolean>;
    private cancelEditDialog$ = defer(() =>
        this.pefDialogService.displayDialog(DialogCancelEditComponent, { disableClose: true }),
    );

    private subscriptions: Subscription[];

    private _form: UntypedFormGroup;
    public form: any; // To prevent the problem of casting AbstractForm to FormArray

    constructor(
        activeRoute: ActivatedRoute,
        private router: Router,
        private store: Store<fromRoot.AppState>,
        private formBuilder: UntypedFormBuilder,
        private pefDialogService: PefDialogService,
    ) {
        store.dispatch({ type: 'RESET_SELECTED_PREISMELDESTELLE' } as preismeldestellenAction);
        this._form = formBuilder.group(
            {
                kontaktpersons: formBuilder.array(range(2).map((i) => this.initKontaktpersonGroup())),
                name: [null, Validators.required],
                supplement: [null],
                street: [null, Validators.required],
                postcode: [null, Validators.required],
                town: [null, Validators.required],
                telephone: [null],
                email: [null],
                internetLink: [null],
                languageCode: [null, Validators.required],
                erhebungsarten: formBuilder.group({
                    tablet: [false],
                    telefon: [false],
                    email: [false],
                    internet: [false],
                    papierlisteVorOrt: [false],
                    papierlisteAbgegeben: [false],
                }),
                pmsGeschlossen: [0],
                erhebungsartComment: [null],
                zusatzInformationen: [null],
                pmsTop: [null],
            },
            { validator: this.formLevelValidationFactory() },
        );
        this.form = this._form;

        const pmsNummerParam$ = activeRoute.params.pipe(map(({ pmsNummer }) => pmsNummer));

        this.distinctPreismeldestelle$ = this.pms$.pipe(
            filter((x) => !!x),
            distinctUntilKeyChanged('isModified'),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        const canSave$ = this.saveClicked$.pipe(
            map(() => ({ isValid: this._form.valid })),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        const save$ = canSave$.pipe(
            filter((x) => x.isValid),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.showValidationHints$ = merge(
            canSave$.pipe(
                distinctUntilChanged(),
                map(() => true),
            ),
            this.distinctPreismeldestelle$.pipe(map(() => false)),
        ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

        this.formErrors$ = this.showValidationHints$.pipe(
            map((showErrors) => (showErrors ? this.getFormErrors() : [])),
        );

        this.hasErrors$ = this.formErrors$.pipe(map((x) => !!x && x.length > 0));

        this.isCurrentModified$ = merge(
            this._form.valueChanges.pipe(map(() => this._form.dirty)),
            save$.pipe(map(() => false)),
        ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

        this.subscriptions = [
            this.distinctPreismeldestelle$.subscribe((preismeldestelle: P.Preismeldestelle) => {
                this._form.markAsUntouched();
                this._form.markAsPristine();
                this._form.patchValue(
                    {
                        kontaktpersons: this.getKontaktPersonMapping(preismeldestelle.kontaktpersons),
                        name: preismeldestelle.name,
                        supplement: preismeldestelle.supplement,
                        street: preismeldestelle.street,
                        postcode: preismeldestelle.postcode,
                        town: preismeldestelle.town,
                        telephone: preismeldestelle.telephone,
                        email: preismeldestelle.email,
                        internetLink: preismeldestelle.internetLink,
                        languageCode: preismeldestelle.languageCode ? preismeldestelle.languageCode : '',
                        erhebungsarten: parseErhebungsarten(preismeldestelle.erhebungsart),
                        pmsGeschlossen: preismeldestelle.pmsGeschlossen,
                        erhebungsartComment: preismeldestelle.erhebungsartComment,
                        zusatzInformationen: preismeldestelle.zusatzInformationen,
                        pmsTop: preismeldestelle.pmsTop,
                    },
                    { onlySelf: true, emitEvent: false },
                );
            }),

            this.isCurrentModified$.subscribe(),

            combineLatest([
                this.store.select(fromRoot.getPreismeldestellen).pipe(filter((x) => !!x && x.length > 0)),
                pmsNummerParam$,
            ]).subscribe(([, pmsNummer]) => {
                this.store.dispatch({ type: 'PREISMELDESTELLE_SELECT', payload: pmsNummer });
            }),

            this.cancelClicked$.subscribe(() => this.navigateToDashboard()),

            this._form.valueChanges
                .pipe(
                    map(() =>
                        assign({}, this._form.value, {
                            erhebungsart: encodeErhebungsartFromForm(this._form.value.erhebungsarten),
                        }),
                    ),
                )
                .subscribe((payload) =>
                    store.dispatch({ type: 'UPDATE_CURRENT_PREISMELDESTELLE', payload } as preismeldestellenAction),
                ),

            this.pmsGeschlossenClicked$
                .pipe(
                    map(() => null),
                    mergeWith(this.distinctPreismeldestelle$),
                    scan((pmsGeschlossen, p) => {
                        if (p) return p.pmsGeschlossen;
                        return pmsGeschlossen === this._form.value.pmsGeschlossen
                            ? null
                            : this._form.value.pmsGeschlossen;
                    }, 0),
                    filter((pmsGeschlossen) => !pmsGeschlossen),
                )
                .subscribe((x) => {
                    this._form.patchValue({ pmsGeschlossen: 0 });
                }),

            save$.subscribe(() => store.dispatch({ type: 'SAVE_PREISMELDESTELLE' } as preismeldestellenAction)),
        ];
    }

    public ngOnDestroy() {
        this.subscriptions.filter((s) => !!s && !s.closed).forEach((s) => s.unsubscribe());
    }

    public getFormErrors() {
        return Object.keys(this._form.errors || {}).map((errorType) => `validation_${errorType}`);
    }

    private initKontaktpersonGroup() {
        return this.formBuilder.group({
            oid: [null],
            firstName: [null],
            surname: [null],
            personFunction: [null],
            telephone: [null],
            mobile: [null],
            fax: [null],
            email: [null],
            languageCode: [null],
        });
    }

    private getKontaktPersonMapping(kontaktpersons: P.KontaktPerson[]) {
        if (!kontaktpersons || kontaktpersons.length === 0)
            kontaktpersons = [<any>{ languageCode: '' }, { languageCode: '' }];
        return kontaktpersons.map((x) => ({
            oid: x.oid,
            firstName: x.firstName,
            surname: x.surname,
            personFunction: x.personFunction,
            telephone: x.telephone,
            mobile: x.mobile,
            fax: x.fax,
            email: x.email,
            languageCode: x.languageCode || '',
        }));
    }

    navigateToDashboard() {
        this.router.navigate(['/']);
    }

    formLevelValidationFactory() {
        return (group: UntypedFormGroup) => {
            const erhebungsarten = group.get('erhebungsarten') as UntypedFormGroup;
            return Object.keys(erhebungsarten.controls).every((k) => !erhebungsarten.get(k).value)
                ? { erhebungsart_required: true }
                : null;
        };
    }

    public canDeactivate() {
        return merge(
            this.distinctPreismeldestelle$.pipe(
                filter((pe) => pe.isModified === false),
                map(() => true),
            ),

            this.distinctPreismeldestelle$.pipe(
                filter((pe) => pe.isModified === true),
                switchMap(() => this.cancelEditDialog$),
                map((dialogCode) => dialogCode === 'THROW_CHANGES'),
            ),
        ).pipe(take(1));
    }
}
