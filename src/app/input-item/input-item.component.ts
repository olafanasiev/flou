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
  static HEIGHT_MULTIPLIER = 1.1;
  @Input()
  item: PageItem;
  @ViewChild('textArea') textAreaElRef: ElementRef;
  @Output()
  enterPressed = new EventEmitter<any>();
  @Output()
  onEmptyField = new EventEmitter<any>();
  @Output()
  inputChanged = new EventEmitter<any>();
  @Output()
  onRemove = new EventEmitter<PageItem>();
  @Output()
  jsPlumbAnchorClicked = new EventEmitter<PageItem>();
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
    const doSaveAction = true;
    this._flouService.removeItem(item, doSaveAction).then(() => {
      this.onRemove.emit(item);
    });
  }


  anchorClicked() {
    this.jsPlumbAnchorClicked.next(this.item);
  }

  ngAfterViewInit() {
    if (new Date(this.item.created).toString() === new Date().toString()) {
      this.textAreaElRef.nativeElement.focus();
    }
    this._flouService.makeSource(this.item.endpointId);
    setTimeout(() => {
      this.textAreaHeight = this.textAreaElRef.nativeElement.scrollHeight;
      this.cd.detectChanges();
      this.inputChanged.emit();
    }, 0);
  }

  removeIfEmpty(value) {
    if (value === EMPTY) {
      this.onEmptyField.next(this.item.endpointId);
    }
  }

  onKeyUp(e?) {
    if (e && e.key === 'Enter' && e.target.value.trim() !== '' && !e.shiftKey) {
      e.target.value = e.target.value.trim();
      this.enterPressed.next(e);
    }

    this.textAreaHeight = 1;
    this.cd.detectChanges();
    this.textAreaHeight =  this.textAreaElRef.nativeElement.scrollHeight;
      this.inputChanged.emit();
    }


  showItemTypes() {
    this._inputItemService.emitPanelShowEvent(this);
  }

}
