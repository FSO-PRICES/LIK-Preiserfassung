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

import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { assign, range } from 'lodash';
import { Observable, Subscription } from 'rxjs';
import {
    combineLatest,
    distinctUntilChanged,
    distinctUntilKeyChanged,
    filter,
    map,
    mapTo,
    merge,
    publishReplay,
    refCount,
    scan,
    tap,
    withLatestFrom,
} from 'rxjs/operators';

import { encodeErhebungsartFromForm, Models as P, parseErhebungsarten } from '@lik-shared';

import { Actions as preismeldestellenAction } from '../../actions/preismeldestellen';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'pms-details',
    templateUrl: 'pms-details.page.html',
    styleUrls: ['pms-details.page.scss'],
})
export class PmsDetailsPage implements OnDestroy {
    public isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    public pms$ = this.store.select(fromRoot.getCurrentPreismeldestelle);
    public languages$ = this.store.select(fromRoot.getLanguagesList);

    public pmsGeschlossenClicked$ = new EventEmitter();
    public formErrors$: Observable<string[]>;
    public hasErrors$: Observable<boolean>;

    public cancelClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter();
    public showValidationHints$: Observable<boolean>;

    private subscriptions: Subscription[];

    private _form: FormGroup;
    public form: any; // To prevent the problem of casting AbstractForm to FormArray

    constructor(
        activeRoute: ActivatedRoute,
        private navCtrl: NavController,
        private store: Store<fromRoot.AppState>,
        private formBuilder: FormBuilder,
    ) {
        store.dispatch({ type: 'RESET_SELECTED_PREISMELDESTELLE' } as preismeldestellenAction);
        this._form = formBuilder.group(
            {
                kontaktpersons: formBuilder.array(range(2).map(i => this.initKontaktpersonGroup())),
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

        const distinctPreismeldestelle$ = this.pms$.pipe(
            filter(x => !!x),
            distinctUntilKeyChanged('_rev'),
            publishReplay(1),
            refCount(),
        );

        const canSave$ = this.saveClicked$.pipe(
            map(() => ({ isValid: this._form.valid })),
            publishReplay(1),
            refCount(),
        );

        const save$ = canSave$.pipe(
            filter(x => x.isValid),
            publishReplay(1),
            refCount(),
        );

        this.showValidationHints$ = canSave$.pipe(
            distinctUntilChanged(),
            mapTo(true),
            merge(distinctPreismeldestelle$.pipe(mapTo(false))),
            publishReplay(1),
            refCount(),
        );

        this.formErrors$ = this.showValidationHints$.pipe(map(showErrors => (showErrors ? this.getFormErrors() : [])));
        this.hasErrors$ = this.formErrors$.pipe(map(x => !!x && x.length > 0));

        this.subscriptions = [
            distinctPreismeldestelle$.subscribe((preismeldestelle: P.Preismeldestelle) => {
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
                        languageCode: !!preismeldestelle.languageCode ? preismeldestelle.languageCode : '',
                        erhebungsarten: parseErhebungsarten(preismeldestelle.erhebungsart),
                        pmsGeschlossen: preismeldestelle.pmsGeschlossen,
                        erhebungsartComment: preismeldestelle.erhebungsartComment,
                        zusatzInformationen: preismeldestelle.zusatzInformationen,
                        pmsTop: preismeldestelle.pmsTop,
                    },
                    { onlySelf: true, emitEvent: false },
                );
            }),

            this.store
                .select(fromRoot.getPreismeldestellen)
                .pipe(
                    filter(x => !!x && x.length > 0),
                    combineLatest(pmsNummerParam$),
                )
                .subscribe(([, pmsNummer]) => {
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
                .subscribe(payload =>
                    store.dispatch({ type: 'UPDATE_CURRENT_PREISMELDESTELLE', payload } as preismeldestellenAction),
                ),

            this.pmsGeschlossenClicked$
                .pipe(
                    mapTo(null),
                    merge(distinctPreismeldestelle$),
                    scan((pmsGeschlossen, p) => {
                        if (!!p) return p.pmsGeschlossen;
                        return pmsGeschlossen === this._form.value.pmsGeschlossen
                            ? null
                            : this._form.value.pmsGeschlossen;
                    }, 0),
                    filter(pmsGeschlossen => !pmsGeschlossen),
                )
                .subscribe(x => {
                    this._form.patchValue({ pmsGeschlossen: 0 });
                }),

            save$.subscribe(() => store.dispatch({ type: 'SAVE_PREISMELDESTELLE' } as preismeldestellenAction)),
        ];
    }

    public ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    public getFormErrors() {
        return Object.keys(this._form.errors || {}).map(errorType => `validation_${errorType}`);
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
        return kontaktpersons.map(x => ({
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
        return this.navCtrl.navigateRoot('/');
    }

    formLevelValidationFactory() {
        return (group: FormGroup) => {
            const erhebungsarten = group.get('erhebungsarten') as FormGroup;
            return Object.keys(erhebungsarten.controls).every(k => !erhebungsarten.get(k).value)
                ? { erhebungsart_required: true }
                : null;
        };
    }
}
