import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {FlouService} from '../../services/flou.service';
import {LabelMeta} from '../models/label-meta';
import {ConnectionMeta} from '../models/connection-meta';
import * as _ from 'lodash';
import {Connection} from 'jsplumb';
import {Page} from '../models/page';
import {Subscription} from 'rxjs/Subscription';
import {PageItem} from '../models/page-item';

@Component({
  selector: 'editable-text-overlay',
  templateUrl: './editable-text-overlay.component.html',
  styleUrls: ['./editable-text-overlay.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class EditableTextOverlayComponent implements OnInit, OnDestroy, AfterViewInit {
  static ROW_HEIGHT = 20;
  static HEIGHT_MULTIPLIER = 0.78;
  @Input()
  connectionMeta: ConnectionMeta;
  @Input()
  jsPlumbConnection: Connection;
  @ViewChild('textareaElRef')
  textareaElRef: ElementRef;
  textareaHeight = 0;
  pageDragStopSubscription: Subscription = null;
  hideLabel = false;
  isDotsVertical = false;

  constructor(private _flouService: FlouService, private _cd: ChangeDetectorRef) {

  }

  adjustDotsPosition(jsPlumbConnection: Connection) {
    this.isDotsVertical = parseInt((<any>jsPlumbConnection).canvas.getAttribute('height'), 10) > FlouService.OVERLAY_STRAIGHT_PATH_HEIGHT;
  }

  clear() {
    this.connectionMeta.labelMeta.text = '';
    this.hideLabel = true;
    this._flouService.saveAction();
  }

  onKeyUp() {
    if (this.textareaElRef.nativeElement.scrollHeight > this.textareaElRef.nativeElement.clientHeight) {
      // textarea creates one empty row more after changes applied so we should remove it
      this.textareaHeight = this.textareaElRef.nativeElement.scrollHeight - EditableTextOverlayComponent.ROW_HEIGHT;
    } else if (this.textareaElRef.nativeElement.scrollHeight === this.textareaElRef.nativeElement.clientHeight) {
      this.textareaHeight = Math.round(this.textareaElRef.nativeElement.value.length * EditableTextOverlayComponent.HEIGHT_MULTIPLIER);
    }

  }

  onLabelChange() {
    this._flouService.saveAction();
  }

  hideDotsShowTextArea() {
    this.hideLabel = false;
    this._cd.detectChanges();
    this.textareaElRef.nativeElement.focus();
  }

  ngAfterViewInit() {
    if (!this.hideLabel) {
      setTimeout(() => {
        this.textareaHeight = this.textareaElRef.nativeElement.scrollHeight - EditableTextOverlayComponent.ROW_HEIGHT;
      }, 0);
    }
  }

  ngOnInit() {
    this.hideLabel = _.isEmpty(this.connectionMeta.labelMeta.text.trim());
    this.adjustDotsPosition(this.jsPlumbConnection);
    this.pageDragStopSubscription = this._flouService.pageDragStop$.subscribe((page: Page) => {
      const itemsIncludeDraggableEndpoint = _.includes(page.items, (item: PageItem) => {
        return item.endpointId === page.endpointId;
      });
      if (this.connectionMeta.targetEndpointId === page.endpointId || itemsIncludeDraggableEndpoint) {
        this.adjustDotsPosition(this.jsPlumbConnection);
      }
    });
  }

  ngOnDestroy() {
    this.pageDragStopSubscription.unsubscribe();
  }

}
