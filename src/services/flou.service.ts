import {Injectable, NgZone} from '@angular/core';
import {Page} from '../app/models/page';
import {UUID} from 'angular2-uuid';
import {PageItem} from '../app/models/page-item';
import * as _ from 'lodash';
import {ConnectionMeta} from '../app/models/connection-meta';
import {ErrorService} from './error.service';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {AsyncSubject} from 'rxjs/AsyncSubject';
import {interval} from 'rxjs';
import {
  Connection,
  ConnectionMadeEventInfo,
  jsPlumb,
  jsPlumbInstance,
  OnConnectionBindInfo,
  OverlaySpec
} from 'jsplumb';
import {Action, steps} from '../app/models/action';
import {
  ConnectorType,
  EventListenerType,
  JSPlumbEventType,
  KeyboardKey,
  OverlayType,
  Strings
} from '../app/shared/app.const';
import EMPTY = Strings.EMPTY;
import {RemovedPageMeta} from '../app/models/removed-page-meta';
import {LabelMeta} from '../app/models/label-meta';
import {ThemingService} from '../app/theming.service';
import {EventListener} from '@angular/core/src/debug/debug_node';
import {NgElement, WithProperties} from '@angular/elements';
import {EditableTextOverlayComponent} from '../app/editable-text-overlay/editable-text-overlay.component';

export namespace LastAction {
  export const undo = 'undo';
  export const redo = 'redo';
  export const action = 'action';
}

@Injectable()
export class FlouService {
  static readonly OVERLAY_ARROW_ID = 'arrow';
  static readonly OVERLAY_CUSTOM_ID = 'editableText';
  static readonly OVERLAY_EDIT_CLASS = 'overlay-label--edit';
  static readonly OVERLAY_CLASS_DOTS = 'overlay-is-empty';
  static readonly OVERLAY_STRAIGHT_PATH_HEIGHT = 25;
  jsPlumbInstance: jsPlumbInstance;
  pages: Page[];
  pageDragStop$: Observable<any>;
  pageDragStop: Subject<any>;
  currentAction: Action;
  DEFAULT_STATE_KEY = 'default_state';
  LAST_HEIGHT = 'last_height';


  emitPageDragStopped(page: Page) {
    this.pageDragStop.next(page);
  }

  constructor(private _errorService: ErrorService, private _zone: NgZone, private _theming: ThemingService) {
    this.pageDragStop = new Subject();
    this.pageDragStop$ = this.pageDragStop.asObservable();
    const autoSaveState = interval(10000);
    autoSaveState.subscribe(() => {
      localStorage.setItem(this.DEFAULT_STATE_KEY, JSON.stringify(this.pages));
    });
  }

  saveAppHeight(newHeight) {
    localStorage.setItem(this.LAST_HEIGHT, newHeight);
  }

  getLastAppHeight() {
    const lastHeight = localStorage.getItem(this.LAST_HEIGHT);
    if (lastHeight) {
      return parseInt(lastHeight, 10);
    }
    return null;
  }

  loadLastAppState(): Promise<any> {
    const resultPromise = new Promise<any>((resolve, reject) => {
      const loadedState = localStorage.getItem(this.DEFAULT_STATE_KEY);

      if (loadedState) {
        try {
          this.pages = JSON.parse(loadedState);
        } catch (e) {
          this.pages = [];

        }
      } else {
        this.pages = [];
      }
      if (!_.isEmpty(this.pages)) {
        this.import(this.pages).then(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
    return resultPromise;
  }


  getPages() {
    return this.pages;
  }

  makeSource(inputItemId) {
    this.jsPlumbInstance.makeSource(inputItemId, {
      anchor: ['RightMiddle'],
      endpoint: ['Rectangle', {width: 1, height: 0}]
    });
  }

  makeTarget(pageId) {
    this.jsPlumbInstance.makeTarget(pageId,
      {
        anchor: 'Continuous',
        endpoint: ['Rectangle', {width: 1, height: 1}]
      });
  }


  triggerMouseEvent(node, eventType) {
    const clickEvent = document.createEvent('MouseEvents');
    clickEvent.initEvent(eventType, true, true);
    node.dispatchEvent(clickEvent);
  }

  initJsPlumb(): Promise<any> {
    const promise = new Promise<any>((resolve, reject) => {
      try {
        if (this.jsPlumbInstance) {
          this.jsPlumbInstance.deleteEveryEndpoint();
        } else {
          this.jsPlumbInstance = jsPlumb.getInstance({Container: document.getElementById('pages')});


          this.jsPlumbInstance.importDefaults({
            Connector: [ConnectorType.FLOWCHART], Overlays: [
              [OverlayType.ARROW, {
                location: 1,
                id: FlouService.OVERLAY_ARROW_ID,
                length: 18,
                paintStyle: {'fill': this._theming.getCurrent().style.fill},
                width: 15,
                cssClass: 'arrow-connector',
                foldback: 0.9,
              }
              ],

              // []
            ], PaintStyle: {strokeWidth: 2, stroke: '#456'},
            DragOptions: {cursor: 'move'},
          });

          this.jsPlumbInstance.bind(EventListenerType.CLICK, (connection: any, event) => {
            if ((<any>event.target).nodeName === 'path') {
              const connectionsToRemove = (<any>this.getJsPlumbInstance()).getConnections({
                source: connection.sourceId,
                target: connection.targetId
              });
              connectionsToRemove.forEach(c => this.jsPlumbInstance.deleteConnection(c));
              const pageItem: PageItem = this.findPageItem(connection.sourceId);
              _.remove(pageItem.connectionMeta, meta =>
                meta.sourceEndpointId === connection.sourceId && meta.targetEndpointId === connection.targetId);
              // this.jsPlumbInstance.deleteConnection(connection);
              this.saveAction();
            }
          });

          this.jsPlumbInstance.bind(JSPlumbEventType.CONNECTION, (newConnectionInfo: ConnectionMadeEventInfo, mouseEvent: MouseEvent) => {
            // If we add connection by hand then we should also add metainfo
            if (mouseEvent) {

              const pageItem: PageItem = this.findPageItem(newConnectionInfo.sourceId);
              const newLabel: LabelMeta = {
                id: this.generateId(),
                text: EMPTY,
              };

              const connectionMeta: ConnectionMeta = {
                id: this.generateId(),
                sourceEndpointId: newConnectionInfo.sourceId,
                targetEndpointId: newConnectionInfo.targetId,
                labelMeta: newLabel
              };
              if (pageItem != null) {
                pageItem.connectionMeta.push(connectionMeta);
                this.saveAction();
              }
              this.addConnectionLabel(newConnectionInfo, connectionMeta);

            } else {
              const connectionMeta: ConnectionMeta[] = this.findConnectionMeta(newConnectionInfo.sourceId, newConnectionInfo.targetId);
              if (connectionMeta) {
                connectionMeta.forEach((meta) => {
                  this.addConnectionLabel(newConnectionInfo, meta);
                });
              }
            }
          });
        }
        resolve();
        // })
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }


  getJsPlumbInstance() {
    return this.jsPlumbInstance;
  }

  doesPageIsOverlayingAnotherPage(x, y) {
    return _.find(this.pages, {x: x, y: y}) != null;
  }

  addPage(cx?: number, cy?: number, doSaveAction?: boolean) {
    this.pages.forEach((page) => {
      page.isActive = false;
    });
    const pageWidth = 230;
    const defaultPageHeight = 268;
    const halfPageHeight = defaultPageHeight / 2;
    const halfPageWidth = pageWidth / 2;
    let y = (window.innerHeight / 2 + window.scrollY) - halfPageHeight;
    let x = (window.innerWidth / 2 + window.scrollX) - halfPageWidth;
    if (!cx && !cy) {
      while (this.doesPageIsOverlayingAnotherPage(x, y)) {
        // we are doing shifting page
        x = x + 15;
        y = y + 15;
      }
    } else {
      cx = cx - halfPageHeight;
      cy = cy - halfPageWidth;
    }
    const newPage: Page = {
      x: cx || x,
      y: cy || y,
      width: pageWidth,
      endpointId: this.generateId(),
      title: this._getPageTitle(),
      items: [],
      isActive: true
    };
    this.pages.push(newPage);
    if (doSaveAction) {
      this.saveAction();
    }

  }

  enableDragging(htmlElRef, options?: any) {
    if (options) {
      this.jsPlumbInstance.draggable(htmlElRef, options);
    } else {
      this.jsPlumbInstance.draggable(htmlElRef);
    }

  }

  disableDragging(htmlElRef) {
    this.jsPlumbInstance.setDraggable(htmlElRef, false);
  }

  private _getPageTitle() {
    return `Page ${this.pages.length + 1}`;
  }

  removeItem(item: PageItem, doSaveAction?: boolean): Promise<any> {
    const result = new Promise((resolve, reject) => {
      const page = this.pages.find((findPage) => {
        return _.find(findPage.items, {endpointId: item.endpointId}) != null;
      });

      if (page != null) {
        const jsplumbEndpoint = _.first(this.jsPlumbInstance.getEndpoints(item.endpointId));

        if (jsplumbEndpoint) {
          jsplumbEndpoint.connections.forEach(connection => this.jsPlumbInstance.deleteConnection(connection));
          this.jsPlumbInstance.deleteEndpoint(jsplumbEndpoint);
        }

        _.remove(page.items, (pageItem: PageItem) => {
          return item.endpointId === pageItem.endpointId;
        });


        if (doSaveAction) {
          this.saveAction();
        }
        resolve();
      }

    });
    return result;


  }

  findConnectionMeta(sourceId, targetId): ConnectionMeta[] {
    const pageItem = this.findPageItem(sourceId);
    const connections: ConnectionMeta[] = _.filter(pageItem.connectionMeta, {sourceEndpointId: sourceId, targetEndpointId: targetId});
    return connections;
  }

  findPageItem(sourceId): PageItem {
    for (let pageIndex = 0; pageIndex < this.pages.length; pageIndex++) {
      const pageItem = _.find(this.pages[pageIndex].items, {endpointId: sourceId});
      if (pageItem) {
        return pageItem;
      }
    }
    return null;
  }

  _setLabelHeight(textarea) {
    const numberOfLines = textarea.value.split(/\r|\r\n|\n/).length;
    textarea.style.height = numberOfLines * 15 + 'px';
  }



  addConnectionLabel(connectionMadeInfo: ConnectionMadeEventInfo, connectionMeta: ConnectionMeta) {
    const jsplumbConnectionWithOverlay = (<any>connectionMadeInfo.connection).addOverlay([OverlayType.CUSTOM, {
      create: (component) => {
        // we are creating web component which will be controlled by angular
        const textOverlay = document.createElement('editable-text-overlay') as NgElement & WithProperties<EditableTextOverlayComponent>;
        textOverlay.connectionMeta = connectionMeta;
        textOverlay.jsPlumbConnection = connectionMadeInfo.connection;
        return textOverlay;
      },
      location: [0.5],
      id: FlouService.OVERLAY_CUSTOM_ID
    }]);
  }

  drawConnection(sourceHtmlId: string, targetHtmlId: string, label: LabelMeta): Connection {
    const connection = this.jsPlumbInstance.connect({
      detachable: true,
      source: sourceHtmlId, target: targetHtmlId,
    });

    return connection;
  }

  restorePage(page: Page, doSaveAction?: boolean) {
    this.pages.push(page);
  }


  ctrlZ(): Promise<any> {
    const promise = new Promise((resolve, reject) => {
      if (this.currentAction && this.currentAction.prev) {
        this.currentAction = this.currentAction.prev;
        this.initJsPlumb().then(() => {
          this.pages = this.currentAction.pages;
          if (!this.pages) {
            this.pages = [];
          }
          resolve();
        });
      }
    });
    return promise;
  }

  ctrlY() {
    const promise = new Promise((resolve, reject) => {
      if (this.currentAction && this.currentAction.next) {
        this.currentAction = this.currentAction.next;
        this.initJsPlumb().then(() => {
          this.pages = this.currentAction.pages;
          if (!this.pages) {
            this.pages = [];
          }
          resolve();
        });
      }
    });
    return promise;
  }

  export() {
    return JSON.stringify(this.pages);
  }

  import(importedPages: Page[]): Promise<any> {
    const result = new Promise<any>((resolve, reject) => {
      this.initJsPlumb().then(() => {
        this.pages = importedPages;
        resolve();
      });
    });
    return result;
  }

  removeAllPages() {
    this.pages.length = 0;
  }

  removePage(page: Page, doSaveAction?: boolean): Promise<RemovedPageMeta> {
    const result = new Promise<RemovedPageMeta>((resolve, reject) => {
      try {
        const removedPage: Page = _.first(_.remove(this.pages, (currentPage) => {
          return currentPage.endpointId === page.endpointId;
        }));


        // We should clean meta information from all pages that was connected to our page
        const targetMetaInfoToClean = removedPage.endpointId;
        const removedConnections: ConnectionMeta[] = [];
        this.pages.forEach((_page) => {
          let connections: ConnectionMeta[] = [];
          _page.items.forEach(pageItem => {
            connections = _.remove(pageItem.connectionMeta, meta => meta.targetEndpointId === targetMetaInfoToClean);
            removedConnections.push(...connections);
          });

        });
        // metaInfoToCleremovedPage.endpointId;
        this.getJsPlumbInstance().remove(removedPage.endpointId);
        const removedPageMeta: RemovedPageMeta = {page: removedPage, inputConnections: removedConnections};
        resolve(removedPageMeta);
      } catch (e) {
        this._errorService.onError.next(e);
        reject(e);
      }

    });
    if (doSaveAction) {
      this.saveAction();
    }
    return result;
  }

  saveAction() {
    if (!this.currentAction) {
      steps.actionsCount = 0;
      this.currentAction = new Action(_.cloneDeep(this.pages));
      steps.actionsCount++;
    } else {
      steps.actionsCount++;
      this.currentAction = this.currentAction.addAction(_.cloneDeep(this.pages));
    }

  }

  generateId(): string {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  addItem(page: Page, type?: string, doSaveAction?: boolean) {
    let item: PageItem = null;
    if (!type) {
      item = {
        type: 'input', title: `Item ${page.items.length + 1}`,
        endpointId: this.generateId(), created: Date.now(), connectionMeta: []
      };
    } else {
      item = {
        type: type, title: `Item ${page.items.length + 1}`,
        endpointId: this.generateId(), created: Date.now(), connectionMeta: []
      };
    }
    page.items.push(item);
    if (doSaveAction) {
      this.saveAction();
    }
  }


}
