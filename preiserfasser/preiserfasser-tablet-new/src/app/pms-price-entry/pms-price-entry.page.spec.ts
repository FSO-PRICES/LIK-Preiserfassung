import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PmsPriceEntryPage } from './pms-price-entry.page';

describe('PmsPriceEntryPage', () => {
  let component: PmsPriceEntryPage;
  let fixture: ComponentFixture<PmsPriceEntryPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PmsPriceEntryPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PmsPriceEntryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
