import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonItemComponent } from './button-item.component';

describe('ButtonItemComponent', () => {
  let component: ButtonItemComponent;
  let fixture: ComponentFixture<ButtonItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ButtonItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ButtonItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
