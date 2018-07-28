import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemPanelComponent } from './item-panel.component';

describe('ItemPanelComponent', () => {
  let component: ItemPanelComponent;
  let fixture: ComponentFixture<ItemPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
