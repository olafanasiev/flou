import {Injectable, NgZone} from '@angular/core';
import { Page } from '../app/models/page';
import { UUID } from 'angular2-uuid';
import { PageItem } from '../app/models/page-item';
import * as _ from 'lodash';
import { ConnectionMeta } from '../app/models/connection-meta';
import { ErrorService } from './error.service';
import {Subject, Observable, BehaviorSubject, AsyncSubject} from 'rxjs';
import { interval } from 'rxjs';
import {
  Connection,
  ConnectionMadeEventInfo,
  jsPlumb,
  jsPlumbInstance,
  OnConnectionBindInfo,
  OverlaySpec
} from 'jsplumb';
import { Action, steps } from '../app/models/action';
import {
  ConnectorType,
  EventListenerType,
  JSPlumbEventType,
  KeyboardKey,
  OverlayType,
  Strings
} from "../app/shared/app.const";
import EMPTY = Strings.EMPTY;
import {RemovedPageMeta} from "../app/models/removed-page-meta";
import {LabelMeta} from "../app/models/label-meta";

export namespace LastAction {
    export const undo = 'undo';
    export const redo = 'redo';
    export const action = 'action';
}
@Injectable()
export class FlouService {
    jsPlumbInstance: jsPlumbInstance;
    pages: Page[];
    pageDragStop$: Observable<any>;
    pageDragStop: Subject<any>;
    currentAction:Action;
    DEFAULT_STATE_KEY = 'default_state';
    LAST_HEIGHT = "last_height";
    static readonly OVERLAY_ARROW_ID = "arrow";
    static readonly OVERLAY_CUSTOM_ID = "editableText";
    static readonly OVERLAY_EDIT_CLASS = "overlay-label--edit";

    emitDragStopped() {
      this.pageDragStop.next();
    }

    constructor(private _errorService: ErrorService, private _zone: NgZone) {
      this.pageDragStop = new Subject();
      this.pageDragStop$ = this.pageDragStop.asObservable();

      const autoSaveState = interval(10000);
      autoSaveState.subscribe( () => {
        localStorage.setItem( this.DEFAULT_STATE_KEY, JSON.stringify( this.pages ));
      });
    }

    saveAppHeight(newHeight) {
      localStorage.setItem(this.LAST_HEIGHT, newHeight);
    }

    getLastAppHeight() {
      const lastHeight = localStorage.getItem(this.LAST_HEIGHT);
      if( lastHeight ) {
        return parseInt(lastHeight);
      }
      return null;
    }

    loadLastAppState(): Promise<any> {
      const resultPromise = new Promise<any>((resolve, reject)=>{
        const loadedState = localStorage.getItem( this.DEFAULT_STATE_KEY );

        if( loadedState ) {
          try {
            this.pages = JSON.parse(loadedState);
          } catch ( e ) {
            this.pages = [];

          }
        } else {
          this.pages = [];
        }
        if( !_.isEmpty(this.pages) ) {
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
        this.jsPlumbInstance.makeSource( inputItemId, {anchor: ['RightMiddle'],
                endpoint: ['Rectangle', { width: 1, height: 1}] });
    }

    makeTarget(pageId) {
        this.jsPlumbInstance.makeTarget(pageId,
           {anchor: 'Continuous',
            endpoint: ['Rectangle', { width: 1, height: 1}]
        });
    }

    initJsPlumb():Promise<any> {
      const promise = new Promise<any>((resolve, reject)=>{
        try {
          if (this.jsPlumbInstance) {
            this.jsPlumbInstance.deleteEveryEndpoint();
          } else {
            this.jsPlumbInstance = jsPlumb.getInstance({Container: document.getElementById('pages')});


              this.jsPlumbInstance.importDefaults({
                Connector: [ConnectorType.FLOWCHART ], Overlays: [
                [  OverlayType.ARROW, {
                    location: 1,
                    id: FlouService.OVERLAY_ARROW_ID,
                    length: 8,
                    foldback: 0.9
                  }
                ],

              // []
            ], PaintStyle: {strokeWidth: 4, stroke: '#456'},
            DragOptions: {cursor: "move"},
          });

            this.jsPlumbInstance.bind(JSPlumbEventType.CONNECTION, (newConnectionInfo:ConnectionMadeEventInfo, mouseEvent: Event) => {
              // If we add connection by hand then we should also add metainfo
              if(mouseEvent){
                // this.connectionMade.next(newConnectionInfo);
                let pageItem: PageItem = this.findPageItem(newConnectionInfo.sourceId);
                let newLabel = {
                  id: this.generateId(),
                  label: EMPTY,
                  rotation: 0
                };

                if( pageItem != null ) {
                    pageItem.connectionMeta.push({sourceEndpointId: newConnectionInfo.sourceId, targetEndpointId: newConnectionInfo.targetId, label: newLabel});
                    this.saveAction();
                }

                this.addConnectionLabel(newConnectionInfo, newLabel);

              }
            });
          }
            resolve();
          // })
        } catch(e) {
          reject(e);
        }
      });

    return promise;
    }


    getJsPlumbInstance() {
        return this.jsPlumbInstance;
    }

    doesPageIsOverlayingAnotherPage(x,y) {
      return  _.find(this.pages, {x:x, y:y}) != null;
    }

    addPage(cx?: number, cy?: number, doSaveAction?:boolean) {
        this.pages.forEach((page) => {
            page.isActive = false;
        });
        const pageWidth = 230;
        const defaultPageHeight = 268;
        const halfPageHeight = defaultPageHeight / 2;
        const halfPageWidth = pageWidth / 2;
        let y = (window.innerHeight / 2 + window.scrollY) - halfPageHeight;
        let x = (window.innerWidth / 2 + window.scrollX) - halfPageWidth;
        if( !cx && !cy ) {
          while (this.doesPageIsOverlayingAnotherPage(x, y)) {
            //we are doing shifting page
            x = x + 15;
            y = y + 15;
          }
        } else {
          cx = cx - halfPageHeight;
          cy = cy - halfPageWidth;
        }
        const newPage:Page = {
          x: cx || x,
          y: cy || y,
          width: pageWidth,
          endpointId: this.generateId(),
          title: this._getPageTitle(),
          items: [],
          isActive: true
        };
            this.pages.push(newPage);
            if( doSaveAction ) {
                this.saveAction();
            }
        
    }

    enableDragging(htmlElRef, options?:any) { 
        if( options ) {
            this.jsPlumbInstance.draggable(htmlElRef, options );
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

    removeItem(item: PageItem, doSaveAction?:boolean): Promise<any>{
      const result = new Promise((resolve, reject) => {
        let page = this.pages.find((page) => {
          return _.find(page.items, {endpointId:item.endpointId})!=null;
        });

        if( page != null ){
          let jsplumbEndpoint = _.first( this.jsPlumbInstance.getEndpoints(item.endpointId));

          if( jsplumbEndpoint ) {
            jsplumbEndpoint.connections.forEach(connection => this.jsPlumbInstance.deleteConnection(connection));
            this.jsPlumbInstance.deleteEndpoint(jsplumbEndpoint);
          }

          _.remove(page.items, (pageItem: PageItem) => {
            return item.endpointId == pageItem.endpointId;
          });


          if( doSaveAction ) {
            this.saveAction();
          }
          resolve();
        }

      });
    return result;

            
    }

    _changeViewOverlayOnEditOverlay(div: HTMLElement, labelMeta: LabelMeta, component) {
        const label = div.innerText;
        let overlayContainer = div.parentElement;
        this._clearContainer(overlayContainer);
        let editTemplate = this._generateEditTemplate(labelMeta, component);
        overlayContainer.append(editTemplate);
        overlayContainer.querySelector("textarea").focus();
    }

    _changeEditOverlayOnViewOverlay(div: HTMLElement, labelMeta: LabelMeta, component: any) {
        this._clearContainer(div);
        let viewTemplate = this._generateViewTemplate( labelMeta, component);
        div.append(viewTemplate);
    }

    _clearContainer(container: Element) {
      container.innerHTML = "";
    }

    _viewTextOverlay(label?: LabelMeta): OverlaySpec {
      return [OverlayType.CUSTOM, {
        create:(component)=>{
          if( !label ) {
            label = {label: EMPTY, rotation:0, id: this.generateId()};
          }
          const div = document.createElement('div');
          div.append(this._generateViewTemplate(label, component));
          div.setAttribute("data-label-id", label.id);
          return div;
        },
        location:[0.5],
        id: FlouService.OVERLAY_CUSTOM_ID
      }];
    }


    _getRotationValueFromHTMLEl(elRef: HTMLElement) {
      let result = 0;
      let transformStyle = elRef.style.transform;
      if( transformStyle.search("rotate") != -1 ) {
        result = parseInt(transformStyle.substring(transformStyle.indexOf("rotate(") + 7, transformStyle.indexOf("deg")));
      }
      return result;
    }

    findConnectionMeta(sourceId, targetId ) {
      let pageItem = this.findPageItem(sourceId);
      let connections: ConnectionMeta[] =  _.filter(pageItem.connectionMeta, {sourceEndpointId: sourceId,targetEndpointId: targetId});
      return connections;
    }

    findPageItem(sourceId): PageItem {
      for ( let pageIndex = 0 ; pageIndex < this.pages.length; pageIndex++ ) {
        let pageItem = _.find( this.pages[pageIndex].items, {endpointId: sourceId });
        if( pageItem ) {
          return pageItem;
        }
      }
      return null;
    }


    _generateViewTemplate( label: LabelMeta, component: any):HTMLElement {
      let div = document.createElement('div');
      div.classList.add('label-container', 'label-view-template');
      div.innerText = label.label;

      let controlButtons = document.createElement('div');
      controlButtons.classList.add('label-control-buttons');

      let editIcon= document.getElementById("flou-templates__label-edit").cloneNode(true);
      let rotateIcon = document.getElementById("flou-templates__label-rotate").cloneNode(true);
      let trashIcon = document.getElementById("flou-templates__label-trash").cloneNode(true);

      controlButtons.append(rotateIcon);
      controlButtons.append(editIcon);
      controlButtons.append(trashIcon);
      div.append(controlButtons);

      let removeEventListeners = () => {
        editIcon.removeEventListener(EventListenerType.CLICK, editButtonHandler);
        rotateIcon.removeEventListener(EventListenerType.CLICK, rotateButtonHandler);
        trashIcon.removeEventListener(EventListenerType.CLICK, trashButtonHandler);
      };

      let trashButtonHandler = (ev: Event) => {
        let connectionsToRemove = (<any>this.getJsPlumbInstance()).getConnections({source: component.sourceId, target: component.targetId});
        connectionsToRemove.forEach(c=>this.jsPlumbInstance.deleteConnection(c));
        let  pageItem:PageItem = this.findPageItem(component.sourceId);
        _.remove(pageItem.connectionMeta, meta => meta.sourceEndpointId == component.sourceId && meta.targetEndpointId == component.targetId );
        this.saveAction();
      };

      let editButtonHandler = (ev: Event) => {
        removeEventListeners();
       this._changeViewOverlayOnEditOverlay(div, label, component);
      };

      let rotateButtonHandler = (ev: Event ) => {
       let overlayContainer = div.parentElement;
       let transformStyle = overlayContainer.style.transform;
       let currentRotateValue;
           currentRotateValue = this._getRotationValueFromHTMLEl(overlayContainer);
         if( currentRotateValue == 270 ) {
           currentRotateValue = 0;
         } else {
           currentRotateValue+=90;
         }
         if( transformStyle.includes('rotate')) {
           transformStyle = transformStyle.replace(/rotate\(\d+deg\)/, `rotate(${currentRotateValue}deg)`);
         } else {
           transformStyle+= ` rotate(${currentRotateValue}deg)`;
         }

         div.parentElement.style.transform  = transformStyle;
         label.rotation = currentRotateValue;
         this.saveAction();
      };



      editIcon.addEventListener(EventListenerType.CLICK,editButtonHandler);
      rotateIcon.addEventListener(EventListenerType.CLICK, rotateButtonHandler);
      trashIcon.addEventListener(EventListenerType.CLICK, trashButtonHandler);
      return div;
    }


    _generateEditTemplate(labelMeta: LabelMeta, component: any) {
      const div = document.createElement('div');
      div.classList.add('label-container', 'label-edit-template');
      const textarea = document.createElement('textarea');
      textarea.value = labelMeta.label;
      textarea.classList.add(FlouService.OVERLAY_EDIT_CLASS);

      let focusOutHandler = (ev: Event) => {
        removeEventListeners();
        const textArea = (<HTMLTextAreaElement>ev.target);
        labelMeta.label = textArea.value;
        this.saveAction();
        this._changeEditOverlayOnViewOverlay(div.parentElement, labelMeta, component);
      };

      let keyUpHandler = (ev: KeyboardEvent) => {
        if( ev.key == KeyboardKey.ENTER && !ev.shiftKey ) {
          focusOutHandler(ev);
        }
      };

      let removeEventListeners = () => {
        textarea.removeEventListener(EventListenerType.FOCUS_OUT, focusOutHandler);
        textarea.removeEventListener(EventListenerType.KEYUP, keyUpHandler);
      };

      textarea.addEventListener(EventListenerType.FOCUS_OUT, focusOutHandler );
      textarea.addEventListener(EventListenerType.KEYUP, keyUpHandler);
      div.append(textarea);
      return div;
    }

    _editableTextOverlay(label?: LabelMeta): OverlaySpec {
     return [OverlayType.CUSTOM, {
        create:(component)=>{
          const div = document.createElement('div');
          if( !label) {
            label = {label: EMPTY, rotation:0, id: this.generateId()};
          }
          div.append(this._generateEditTemplate(label, component));
          return div;
        },
        location:[0.5],
        id: FlouService.OVERLAY_CUSTOM_ID
      }];
    }

    addConnectionLabel(jsPlumbConnection: ConnectionMadeEventInfo, label: LabelMeta) {
      let jsplumbConnectionWithOverlay = (<any>jsPlumbConnection.connection).addOverlay(this._editableTextOverlay(label));
      jsplumbConnectionWithOverlay.component
                                  .getOverlay(FlouService.OVERLAY_CUSTOM_ID)
                                  .canvas.querySelector("textarea").focus();
    }

  drawViewConnection(sourceHtmlId: string, targetHtmlId: string, label: LabelMeta): Connection {
      let connection = this.jsPlumbInstance.connect({source: sourceHtmlId, target: targetHtmlId, overlays:[
          this._viewTextOverlay(label)
        ]});
      let overlayContainer = (<any> connection.getOverlay(FlouService.OVERLAY_CUSTOM_ID )).canvas;
          overlayContainer.style.transform +=" rotate(" + label.rotation + "deg)";
      return connection;
  }

    restorePage(page:Page, doSaveAction?: boolean) {
        this.pages.push(page);
    }



    ctrlZ(): Promise<any>{
      const promise = new Promise((resolve, reject) => {
        if( this.currentAction && this.currentAction.prev ) {
          this.currentAction = this.currentAction.prev;
          this.initJsPlumb().then(() => {
            this.pages = this.currentAction.pages;
            if( !this.pages ) {
              this.pages = [];
            }
            resolve();
          });
        }
      });
       return promise;
    }

    ctrlY(){
      const promise = new Promise((resolve, reject) => {
        if( this.currentAction && this.currentAction.next ) {
            this.currentAction = this.currentAction.next;
          this.initJsPlumb().then(() => {
            this.pages = this.currentAction.pages;
            if( !this.pages ) {
              this.pages = [];
            }
            resolve();
          });
        }
      });
      return promise;
    }

    export() { 
        return JSON.stringify( this.pages );
    }

    import(importedPages: Page[]): Promise<any> {
      const result = new Promise<any>((resolve, reject) => {
        this.initJsPlumb().then(() => {
          this.pages = importedPages;
          resolve()
        });
      });
      return result
    }

    removeAllPages() {
        this.pages.length = 0;
    }

    removePage(page: Page, doSaveAction?:boolean):Promise<RemovedPageMeta> {
        let result = new Promise<RemovedPageMeta>((resolve,reject)=>{
        try {
            let removedPage:Page = _.first(_.remove(this.pages, (currentPage) => {
                return currentPage.endpointId == page.endpointId;
            }));


            // We should clean meta information from all pages that was connected to our page
            let targetMetaInfoToClean = removedPage.endpointId;
            let removedConnections: ConnectionMeta[] = [];
            this.pages.forEach((page) => {
               let connections: ConnectionMeta[] = [];
                page.items.forEach(pageItem => {
                   connections = _.remove(pageItem.connectionMeta, meta => meta.targetEndpointId == targetMetaInfoToClean);
                   removedConnections.push(...connections);
                });

            });
          // metaInfoToCleremovedPage.endpointId;
            this.getJsPlumbInstance().remove(removedPage.endpointId);
            let removedPageMeta: RemovedPageMeta = {page: removedPage, inputConnections: removedConnections}
            resolve(removedPageMeta);
        } catch( e ) { 
            this._errorService.onError.next(e);
            reject(e);
        }
        
        });
        if(doSaveAction) { 
            this.saveAction();
        }
      return result;
    }

    saveAction() {
        if( !this.currentAction ) {
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
        if ( !type ) {
            item = { type: 'input', title: `Item ${page.items.length + 1}`,
                 endpointId: this.generateId(), created: Date.now(), connectionMeta: []};
        } else {
            item = { type: type, title: `Item ${page.items.length + 1}`,
                 endpointId: this.generateId(), created: Date.now(), connectionMeta: []};
        }
        page.items.push(item);
        if( doSaveAction ) { 
            this.saveAction();
        }
    }

    

}
