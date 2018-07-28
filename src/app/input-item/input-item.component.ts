import { Component, Input, OnInit, ViewContainerRef } from '@angular/core';
import { InputItemService } from '../../services/input-item.service';

@Component({
  selector: 'app-input-item',
  templateUrl: './input-item.component.html',
  styleUrls: ['./input-item.component.css']
})
export class InputItemComponent implements OnInit {
  @Input()
  type = 'input';
  @Input()
  position: number;
  @Input()
  title: string;
  @Input()
  htmlId: string;
  isJsPlumbed = false;
  constructor(public viewRef: ViewContainerRef, private inputItemService: InputItemService) {
    this.type = 'input';
  }

  ngOnInit() {
      this.viewRef.element.nativeElement.id = this.htmlId;
  }

  showItemTypes() {
    this.inputItemService.emitPanelShowEvent(this);
  }

}
