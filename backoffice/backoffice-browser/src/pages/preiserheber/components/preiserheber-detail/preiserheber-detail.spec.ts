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

import { TestBed, ComponentFixture, async } from '@angular/core/testing';
import { DebugElement, SimpleChanges, SimpleChange, OnChanges } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from 'ionic-angular';
import {} from 'jasmine';

import { PefComponentsModule } from 'lik-shared';

import { Backoffice } from '../../../../app/app.component';

import { PefDialogCancelEditModule } from '../../../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';
import { PefMenuModule } from '../../../../components/pef-menu/pef-menu.module';

import { PreiserheberDetailComponent } from './preiserheber-detail';
import { By } from '@angular/platform-browser';

let component: PreiserheberDetailComponent;
let fixture: ComponentFixture<PreiserheberDetailComponent>;
let de: DebugElement;
let el: HTMLElement;

describe('Component: [Preiserheber] PreiserheberDetailComponent', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [Backoffice, PreiserheberDetailComponent],
            providers: [

            ],
            imports: [
                IonicModule.forRoot(Backoffice),
                ReactiveFormsModule,
                FormsModule,
                PefComponentsModule,
                PefMenuModule,
                PefDialogCancelEditModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PreiserheberDetailComponent);
        component = fixture.componentInstance;
        el = fixture.nativeElement;
        de = fixture.debugElement;
        spyOn(component, 'ngOnChanges').and.callThrough();
    });

    afterEach(() => {
        fixture.destroy();
        component = null;
        de = null;
        el = null;
    });

    it('is created', () => {
        expect(fixture).toBeTruthy();
        expect(component).toBeTruthy();
    });

    it('can save', (done) => {
        expect(component.form.valid).toBeFalsy();

        const updatePreiserheber = (value) => {
            const changesObj: SimpleChanges = {
                preiserheber: new SimpleChange(null, value, true)
            };
            component.preiserheber = value;
            component.ngOnChanges(changesObj);
            fixture.detectChanges();
        };
        const preiserheber = {
            _id: 'sapena',
            _rev: '1',
            firstName: 'Philipp',
            surname: 'Schärer',
            erhebungsregion: 'Bern',
            languageCode: '1',
            telephone: null,
            email: null
        };
        updatePreiserheber(preiserheber);
        component.form.get('password').setValue('asdf');

        component.update$.subscribe(update => {
            expect(update).toBeTruthy();
            updatePreiserheber(update);
        });

        component.save$
            .withLatestFrom(component.preiserheber$, (_, current) => current)
            .subscribe(current => {
                expect(current).toBeTruthy();
                expect(current.erhebungsregion).toBe('Bern');
                done();
            });

        const surname = de.query(By.css('input[formControlName=surname]')).nativeElement;
        const erhebungsregion = de.query(By.css('input[formControlName=erhebungsregion]')).nativeElement;

        expect(component.getPreiserheberForm().valid).toBeTruthy();

        surname.value = '';
        surname.dispatchEvent(new Event('input'));
        erhebungsregion.value = 'Zürich';
        erhebungsregion.dispatchEvent(new Event('input'));

        expect(component.form.valid).toBeFalsy();

        surname.value = 'Bond';
        surname.dispatchEvent(new Event('input'));
        expect(component.form.valid).toBeTruthy();

        component.saveClicked$.emit();
    }, 1000);
});
