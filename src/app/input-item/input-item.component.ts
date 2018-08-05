import { Component, Input, OnInit, ViewContainerRef, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { InputItemService } from '../../services/input-item.service';

@Component({
  selector: 'app-input-item',
  templateUrl: './input-item.component.html',
  styleUrls: ['./input-item.component.css']
})
export class InputItemComponent implements OnInit, AfterViewInit {
  @Input()
  type = 'input';
  @Input()
  position: number;
  @Input()
  title: string;
  @Input()
  htmlId: string;
  @ViewChild('inputButton') inputButton: ElementRef;
  @Output()
  enterPressed = new EventEmitter<any>();
  @Output()
  onEmptyField = new EventEmitter<any>();
  isJsPlumbed = false;
  constructor(public viewRef: ViewContainerRef, private inputItemService: InputItemService) {
    this.type = 'input';
  }

  ngOnInit() {
      this.viewRef.element.nativeElement.id = this.htmlId;
  }

  ngAfterViewInit() {
    this.inputButton.nativeElement.focus();
  }

  removeIfEmpty(value){ 
    if( value == "" ) {
      this.onEmptyField.next(this.htmlId);
    }
  }

  onKeyUp(e) {
    //enter press
    if( e.keyCode == 13 && e.target.value.trim() != "") {
      this.enterPressed.next(e);
    }
  }

  showItemTypes() {
    this.inputItemService.emitPanelShowEvent(this);
  }

}
