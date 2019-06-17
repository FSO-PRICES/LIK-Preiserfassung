import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPriceSeriesPage } from './new-price-series.page';

describe('NewPriceSeriesPage', () => {
  let component: NewPriceSeriesPage;
  let fixture: ComponentFixture<NewPriceSeriesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewPriceSeriesPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewPriceSeriesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
