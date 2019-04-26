import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditableTextOverlayComponent } from './editable-text-overlay.component';

describe('EditableTextOverlayComponent', () => {
  let component: EditableTextOverlayComponent;
  let fixture: ComponentFixture<EditableTextOverlayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditableTextOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditableTextOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
