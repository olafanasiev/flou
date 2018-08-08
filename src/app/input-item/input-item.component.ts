import { Component, Input, OnInit, ViewContainerRef, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { InputItemService } from '../../services/input-item.service';


declare var $;
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
  textAreaHeight = 20;
  @ViewChild('textArea') textAreaElRef: ElementRef;
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
    this.textAreaElRef.nativeElement.focus();
    $(this.textAreaElRef.nativeElement).select();
  }

  removeIfEmpty(value){ 
    if( value == "" ) {
      this.onEmptyField.next(this.htmlId);
    }
  }

  onKeyUp(e) {
    //enter press
    if( e.keyCode == 13 && e.target.value.trim() != "" && !e.shiftKey) {
      this.enterPressed.next(e);
    } 

    if( this.textAreaElRef.nativeElement.scrollHeight > this.textAreaElRef.nativeElement.clientHeight){ 
      this.textAreaHeight = this.textAreaElRef.nativeElement.scrollHeight;
    }
  }

  showItemTypes() {
    this.inputItemService.emitPanelShowEvent(this);
  }

}
