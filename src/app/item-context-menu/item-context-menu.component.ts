import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { InputItemComponent } from '../input-item/input-item.component';
import { InputItemService } from '../../services/input-item.service';
declare var $: any;
@Component({
  selector: 'app-item-context-menu',
  templateUrl: './item-context-menu.component.html',
  styleUrls: ['./item-context-menu.component.css']
})
export class ItemContextMenuComponent implements OnInit {
  itemComponent: InputItemComponent = null;
  isPanelShowed = false;
  topPosition = 0;
  leftPosition = 0;
  constructor(private _inputItemService: InputItemService, private _cd: ChangeDetectorRef) { }

  changeType(type) {
    this.itemComponent.item.type = type;
    this.isPanelShowed = false;
  }

  show(itemComponent: InputItemComponent) {
    this.itemComponent = itemComponent;
  }

  closePanel() {
    if ( this.isPanelShowed ) {
      this.isPanelShowed = false;
    }
  }


  ngOnInit() {
    this._inputItemService.panelShowEvent.subscribe((component: InputItemComponent) => {
      this.itemComponent = component;
      const item$ = $(component._viewRef.element.nativeElement);
      this.topPosition = item$.offset().top - 50;
      this.leftPosition = item$.offset().left - 50;
      this.isPanelShowed = true;
      this._cd.detectChanges();
     });

     this._inputItemService.panelHideEvent.subscribe(() => {
       this.isPanelShowed = false;
     });
  }

}
