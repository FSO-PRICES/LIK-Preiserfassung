import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogNewPmBearbeitungsCodeComponent } from './dialog-new-pm-bearbeitungs-code.component';

describe('DialogNewPmBearbeitungsCodeComponent', () => {
  let component: DialogNewPmBearbeitungsCodeComponent;
  let fixture: ComponentFixture<DialogNewPmBearbeitungsCodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogNewPmBearbeitungsCodeComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogNewPmBearbeitungsCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
