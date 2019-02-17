import { Component, Input, ViewContainerRef, ChangeDetectorRef,
         Output, EventEmitter, ViewChild, ChangeDetectionStrategy, ElementRef, AfterViewInit } from '@angular/core';
import { InputItemService } from '../../services/input-item.service';
import { FlouService } from '../../services/flou.service';
import { PageItem } from '../models/page-item';

declare var $;
@Component({
  selector: 'app-input-item',
  templateUrl: './input-item.component.html',
  styleUrls: ['./input-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class InputItemComponent implements AfterViewInit {
  @Input()
  item: PageItem;
  @ViewChild('textArea') textAreaElRef: ElementRef;
  @Output()
  enterPressed = new EventEmitter<any>();
  @Output()
  onEmptyField = new EventEmitter<any>();
  textAreaHeight = 20;
  constructor(public _viewRef: ViewContainerRef,
              public cd: ChangeDetectorRef,
              private _inputItemService: InputItemService,
              private _flouService: FlouService ) { 
  }

  onTitleChange(newTitle) { 
    this.item.title = newTitle;
    this._flouService.saveAction();
  }

  removeItem(item: PageItem) {
    let doSaveAction = true;
    this._flouService.removeItem(item, doSaveAction);
  }

  ngAfterViewInit() {
    if (new Date( this.item.created).toString() == new Date().toString()){
        this.textAreaElRef.nativeElement.focus();
    }
    this._flouService.makeSource(this.item.htmlId);
  }

  removeIfEmpty(value){ 
    if( value == "" ) {
      this.onEmptyField.next(this.item.htmlId);
    }
  }

  onKeyUp(e) {
    //enter press
    if( e.keyCode == 13 && e.target.value.trim() != "" && !e.shiftKey) {
      e.target.value = e.target.value.trim();
      this.enterPressed.next(e);
    } 

    if( this.textAreaElRef.nativeElement.scrollHeight > this.textAreaElRef.nativeElement.clientHeight){ 
      this.textAreaHeight = this.textAreaElRef.nativeElement.scrollHeight;
    }
  }

  showItemTypes() {
    this._inputItemService.emitPanelShowEvent(this);
  }

}
