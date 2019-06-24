import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PmsSortPage } from './pms-sort.page';

describe('PmsSortPage', () => {
  let component: PmsSortPage;
  let fixture: ComponentFixture<PmsSortPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PmsSortPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PmsSortPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
