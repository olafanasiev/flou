import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppStatesComponent } from './app-states.component';

describe('AppStatesComponent', () => {
  let component: AppStatesComponent;
  let fixture: ComponentFixture<AppStatesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppStatesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppStatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
