import {Injectable, NgZone} from '@angular/core';
import { Page } from '../app/models/page';
import { UUID } from 'angular2-uuid';
import { PageItem } from '../app/models/page-item';
import * as _ from 'lodash';
import { ConnectionMeta } from '../app/models/connection-meta';
import { ErrorService } from './error.service';
import {Subject, Observable, BehaviorSubject, AsyncSubject} from 'rxjs';
import { interval } from 'rxjs';
import {Connection, ConnectionMadeEventInfo, Endpoint, jsPlumb, jsPlumbInstance, OverlaySpec} from 'jsplumb';
import { Action, steps } from '../app/models/action';
import {ConnectorType, EventListenerType, KeyboardKey, OverlayType, Strings} from "../app/shared/app.const";
import EMPTY = Strings.EMPTY;
import {RemovedPageMeta} from "../app/models/removed-page-meta";

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
    endpoints  = [];
    currentAction:Action;
    lastOperation = '';
    DEFAULT_STATE_KEY = 'default_state';
    LAST_HEIGHT = "last_height";
    static readonly OVERLAY_ARROW_ID = "arrow";
    static readonly OVERLAY_CUSTOM_ID = "editableText";
    static readonly OVERLAY_EDIT_CLASS = "overlay-label--edit";
    static readonly OVERLAY_VIEW_CLASS = "overlay-label--view";
    // sourceEndpointCreate

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
            this.jsPlumbInstance.reset();

          } else {
            this.jsPlumbInstance = jsPlumb.getInstance({Container: document.getElementById('pages')});
          }

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

          // this.jsPlumbInstance.ready(() => {

            this.jsPlumbInstance.bind('connection', (newConnectionInfo:ConnectionMadeEventInfo, mouseEvent: Event) => {
              if(mouseEvent){
                // this.connectionMade.next(newConnectionInfo);
                let pageItem: PageItem = this.findPageItemByEndpointId(newConnectionInfo.sourceId);

                if( pageItem != null ) {
                    pageItem.connectionMeta.push({sourceEndpointId: newConnectionInfo.sourceId, targetEndpointId: newConnectionInfo.targetId, label: EMPTY});
                    this.saveAction();
                }

                this.addConnectionLabel(newConnectionInfo, EMPTY);

              }
            });
            resolve();
          // })
        } catch(e) {
          reject(e);
        }
      });

    return promise;
    }

    findPageItemByEndpointId( endpointId: string ):PageItem {
      let pageItem: PageItem = null;
      for( let pageIndex = 0; pageIndex < this.pages.length; pageIndex++ ){
        if( pageItem != null ){
          break;
        }

        for( let itemIndex = 0; itemIndex < this.pages[pageIndex].items.length; itemIndex++ ) {
           if( this.pages[pageIndex].items[itemIndex].endpointId == endpointId ){
                  pageItem = this.pages[pageIndex].items[itemIndex];
            break;
           }
        }
      }
      return pageItem;
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

    _changeViewOverlayOnEditOverlay(div: HTMLElement, component) {
        const label = div.innerText;
        let parentContainer = div.parentElement;
        this._clearContainer(parentContainer);
        let editTemplate = this._generateEditTemplate(label, component);
        parentContainer.append(editTemplate);
        parentContainer.querySelector("textarea").focus();
    }

    _changeEditOverlayOnViewOverlay(div: HTMLElement, component: any) {
        let label = (<HTMLTextAreaElement>div.querySelector('textarea')).value;
        this._clearContainer(div);
        let viewTemplate = this._generateViewTemplate( label, component);
        div.append(viewTemplate);
    }

    _clearContainer(container: Element) {
      container.innerHTML = "";
    }

    _updateConnectionLabel(sourceId: string, targetId: string, label: string) {
      // let connectionInfo: ConnectionMeta = this.findConnectionMeta(sourceId, targetId);
      // connectionInfo.label = label;
      // this.saveAction();
    }

    _viewTextOverlay(defaultValue: string = ""): OverlaySpec {
      return [OverlayType.CUSTOM, {
        create:(component)=>{
          const div = document.createElement('div');
          div.append(this._generateViewTemplate(defaultValue, component));
          return div;
        },
        location:[0.5],
        id: FlouService.OVERLAY_CUSTOM_ID
      }];
    }

    _generateViewTemplate( defaultValue: string, component: any):HTMLElement {
      let div = document.createElement('div');
      div.classList.add('label-container', 'label-view-template');
      div.innerText = defaultValue;

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
        let doSaveAction = true;
        const connectionMeta: ConnectionMeta = {sourceEndpointId: component.sourceId, targetEndpointId: component.targetId, label:null};
        // this.connectionRemove.next(connectionMeta);
        this.getJsPlumbInstance().deleteConnection(component.connection);
        // this.removeConnection({source: sourceId, target: targetId, label: null}, doSaveAction);
      };

      let editButtonHandler = (ev: Event) => {
        removeEventListeners();
       this._changeViewOverlayOnEditOverlay(div, component);
      };

      let rotateButtonHandler = (ev: Event ) => {
       let overlayContainer = div.parentElement;
       let transformStyle = overlayContainer.style.transform;
       let currentRotateValue = 0;
       if( transformStyle.search("rotate") != -1 ) {
         //
         currentRotateValue = parseInt(transformStyle.substring(transformStyle.indexOf("rotate(") + 7, transformStyle.indexOf("deg")));
         // console.log(currentRotateValue);
         if( currentRotateValue == 270 ) {
           currentRotateValue = 0;
         } else {
           currentRotateValue+=90;
         }
           transformStyle = transformStyle.replace(/rotate\(\d+deg\)/, `rotate(${currentRotateValue}deg)`);
       } else {
           transformStyle+=" rotate(90deg)";
       }


       div.parentElement.style.transform  = transformStyle;
      };

      editIcon.addEventListener(EventListenerType.CLICK,editButtonHandler);
      rotateIcon.addEventListener(EventListenerType.CLICK, rotateButtonHandler);
      trashIcon.addEventListener(EventListenerType.CLICK, trashButtonHandler);
      return div;
    }


    _generateEditTemplate(defaultValue: string, component: any) {
      const div = document.createElement('div');
      div.classList.add('label-container', 'label-edit-template');
      const textarea = document.createElement('textarea');
      textarea.value = defaultValue;
      textarea.classList.add(FlouService.OVERLAY_EDIT_CLASS);

      let focusOutHandler = (ev: Event) => {
        removeEventListeners();
        const textArea = (<HTMLTextAreaElement>ev.target);
        this._updateConnectionLabel(component.sourceId, component.targetId, textArea.value);
        this._changeEditOverlayOnViewOverlay(div.parentElement, component);
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

    _editableTextOverlay(defaultValue: string = ""): OverlaySpec {
     return [OverlayType.CUSTOM, {
        create:(component)=>{
          const div = document.createElement('div');
          div.append(this._generateEditTemplate(defaultValue, component));
          return div;
        },
        location:[0.5],
        id: FlouService.OVERLAY_CUSTOM_ID
      }];
    }

    addConnectionLabel(jsPlumbConnection: ConnectionMadeEventInfo, label: string) {
      let jsplumbConnectionWithOverlay = (<any>jsPlumbConnection.connection).addOverlay(this._editableTextOverlay(label));
      jsplumbConnectionWithOverlay.component
                                  .getOverlay(FlouService.OVERLAY_CUSTOM_ID)
                                  .canvas.querySelector("textarea").focus();
    }

  drawViewConnection(sourceHtmlId: string, targetHtmlId: string, label: string): Connection {
      return this.jsPlumbInstance.connect({source: sourceHtmlId, target: targetHtmlId, overlays:[
          this._viewTextOverlay(label)
        ]});
  }

    drawEditConnection(sourceHtmlId: string, targetHtmlId: string, label: string): Connection {
        if( _.includes( this.endpoints, sourceHtmlId) &&  _.includes( this.endpoints, targetHtmlId)) {
            return this.jsPlumbInstance.connect({source: sourceHtmlId, target: targetHtmlId, overlays:[
                this._editableTextOverlay(label)
              ]});
        } else {
          return null;
        }
    }

    restorePage(page:Page, doSaveAction?: boolean) {
        this.pages.push(page);

    }


    private _rebuildPages() {
        this.removeAllPages();
        this.initJsPlumb().then(() => {
          let parsedPages = JSON.parse(this.currentAction.pages);
          this.pages.push(...parsedPages);
        });
    }
    
    ctrlZ(){
        // console.log(this.currentAction); 
        if( this.currentAction && this.currentAction.prev ) { 
            this.currentAction = this.currentAction.prev;
            this.lastOperation = LastAction.undo;
            this._rebuildPages();
        }
    }

    ctrlY(){ 
        if( this.currentAction && this.currentAction.next ) { 
            this.currentAction = this.currentAction.next;
            this.lastOperation = LastAction.redo;
            this._rebuildPages();
        }
    }

    export() { 
        return JSON.stringify( this.pages );
    }

    import(importedPages: Page[]): Promise<any> {
      const result = new Promise<any>((resolve, reject) => {
        this.endpoints = [];
        this.initJsPlumb().then(() => {
          this.pages = importedPages;
          resolve()
        });
      });
      return result
    }

    removeAllPages() { 
        this.pages.forEach((page: Page) => { 
            // this._clearPageFromConnections(page);
        });
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
                });
              removedConnections.push(...connections);

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
        if( this.lastOperation == LastAction.redo || this.lastOperation == LastAction.undo ) {
            this.currentAction = null;
        }

        if( !this.currentAction ) {
            steps.actionsCount = 0;
            this.currentAction = new Action(JSON.stringify(this.pages));
            steps.actionsCount++;
        } else {
            steps.actionsCount++;
            this.currentAction = this.currentAction.addAction(JSON.stringify(this.pages));
        }

        this.lastOperation = LastAction.action;

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
