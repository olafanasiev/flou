import { Component, Input, OnInit, ViewContainerRef, ChangeDetectorRef,
         Output, EventEmitter, ViewChild, ChangeDetectionStrategy, ElementRef, AfterViewInit } from '@angular/core';
import { InputItemService } from '../../services/input-item.service';
import { FlouService } from '../../services/flou.service';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';
import { PageItem } from '../models/page-item';

declare var $;
@Component({
  selector: 'app-input-item',
  templateUrl: './input-item.component.html',
  styleUrls: ['./input-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class InputItemComponent implements OnInit, AfterViewInit {
  @Input()
  item: PageItem;
  textAreaHeight = 20;
  @ViewChild('textArea') textAreaElRef: ElementRef;
  @Output()
  enterPressed = new EventEmitter<any>();
  @Output()
  onEmptyField = new EventEmitter<any>();
  @Output()
  sortStarted = new EventEmitter<any>();
  @Output()
  sortStopped = new EventEmitter<any>();
  // isJsPlumbed = false;
  subscriptions: Subscription[] = [];
  constructor(public _viewRef: ViewContainerRef, 
              private _inputItemService: InputItemService,
              private _flouService: FlouService ) { 
  }

  onTitleChange(newTitle) { 
    this.item.title = newTitle;
    this._flouService.saveAction();
  }

  ngOnInit() {
    this.item.type = 'input';
  }


  removeItem(item: PageItem) {
    let doSaveAction = true;
    this._flouService.removeItem(item, doSaveAction);
  }

  stopSort() {
    this.sortStopped.emit();
  }

  startSort() { 
    this.sortStarted.emit();
  }

  ngAfterViewInit() {
    this.textAreaElRef.nativeElement.focus();
    $(this.textAreaElRef.nativeElement).select();
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
