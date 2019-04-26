import {
  Component, Input, ViewContainerRef, ChangeDetectorRef,
  Output, EventEmitter, ViewChild, ChangeDetectionStrategy, ElementRef, AfterViewInit, OnInit, OnDestroy
} from '@angular/core';
import {InputItemService} from '../../services/input-item.service';
import {FlouService} from '../../services/flou.service';
import {PageItem} from '../models/page-item';
import {Strings} from '../shared/app.const';
import EMPTY = Strings.EMPTY;

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
  @Output()
  onRemove = new EventEmitter<PageItem>();
  textAreaHeight = 20;

  constructor(public _viewRef: ViewContainerRef,
              public cd: ChangeDetectorRef,
              private _inputItemService: InputItemService,
              private _flouService: FlouService) {
  }

  onTitleChange(newTitle) {
    this.item.title = newTitle;
    this._flouService.saveAction();
  }

  removeItem(item: PageItem) {
    let doSaveAction = true;
    this._flouService.removeItem(item, doSaveAction).then(() => {
      this.onRemove.emit(item);
    });
  }


  ngAfterViewInit() {
    if (new Date(this.item.created).toString() == new Date().toString()) {
      this.textAreaElRef.nativeElement.focus();
    }
    this._flouService.makeSource(this.item.endpointId);
  }

  removeIfEmpty(value) {
    if (value == EMPTY) {
      this.onEmptyField.next(this.item.endpointId);
    }
  }

  onKeyUp(e) {
    if (e.key == 'Enter' && e.target.value.trim() != '' && !e.shiftKey) {
      e.target.value = e.target.value.trim();
      this.enterPressed.next(e);
    }

    if (this.textAreaElRef.nativeElement.scrollHeight > this.textAreaElRef.nativeElement.clientHeight) {
      this.textAreaHeight = this.textAreaElRef.nativeElement.scrollHeight;
    }
  }

  showItemTypes() {
    this._inputItemService.emitPanelShowEvent(this);
  }

}
