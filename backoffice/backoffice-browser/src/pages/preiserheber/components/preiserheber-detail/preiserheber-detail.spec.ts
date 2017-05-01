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
                preiserheber: new SimpleChange(null, value)
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
            personFunction: 'developer',
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
                expect(current.personFunction).toBe('MasterChief');
                done();
            });

        const surname = de.query(By.css('input[formControlName=surname]')).nativeElement;
        const personFunction = de.query(By.css('input[formControlName=personFunction]')).nativeElement;

        expect(component.getPreiserheberForm().valid).toBeTruthy();

        surname.value = '';
        surname.dispatchEvent(new Event('input'));
        personFunction.value = 'MasterChief';
        personFunction.dispatchEvent(new Event('input'));

        expect(component.form.valid).toBeFalsy();

        surname.value = 'Bond';
        surname.dispatchEvent(new Event('input'));
        expect(component.form.valid).toBeTruthy();

        component.saveClicked$.emit();
    }, 1000);
});
