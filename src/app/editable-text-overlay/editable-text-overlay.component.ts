import {Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
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
export class EditableTextOverlayComponent implements OnInit, OnDestroy {
  @Input()
  connectionMeta: ConnectionMeta;
  @Input()
  jsPlumbConnection: Connection;

  pageDragStopSubscription: Subscription = null;
  hideLabel = false;
  isDotsVertical = false;

  constructor(private _flouService: FlouService) {

  }

  adjustDotsPosition(jsPlumbConnection: Connection) {
    this.isDotsVertical = parseInt((<any>jsPlumbConnection).canvas.getAttribute('height'), 10) > FlouService.OVERLAY_STRAIGHT_PATH_HEIGHT;
  }

  clear() {
    this.connectionMeta.labelMeta.text = '';
    this.hideLabel = true;
    this._flouService.saveAction();
  }

  onLabelChange() {
    this._flouService.saveAction();
  }

  hideDotsShowTextArea() {
    this.hideLabel = false;
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
