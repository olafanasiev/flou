import { Injectable } from '@angular/core';
import { Page } from '../app/models/page';
import { UUID } from 'angular2-uuid';
import { PageItem } from '../app/models/page-item';
import * as _ from 'lodash';
import { ConnectionMeta } from '../app/models/connectionMeta';
import { ErrorService } from './error.service';
import {Subject, Observable, EMPTY} from 'rxjs';
import { interval } from 'rxjs';
import {ConnectionMadeEventInfo, jsPlumb, jsPlumbInstance, OverlaySpec} from 'jsplumb';
import { Action, steps } from '../app/models/action';
import {ConnectorType, EventListenerType, OverlayType, Strings} from "../app/shared/app.const";
import {EventListener} from "@angular/core/src/debug/debug_node";

export namespace LastAction {
    export const undo = 'undo';
    export const redo = 'redo';
    export const action = 'action';
}
@Injectable()
export class FlouService {
    jsPlumbInstance: jsPlumbInstance;
    pages: Page[];
    jsPlumbConnections: ConnectionMadeEventInfo[] = [];
    pageLoaded: Subject<any>;
    pageLoaded$: Observable<any>;
    pageDragStop$: Observable<any>;
    pageDragStop: Subject<any>;
    endpoints  = [];
    currentAction:Action;
    lastOperation = '';
    DEFAULT_STATE_KEY = 'default_state';
    LAST_HEIGHT = "last_height";
    static readonly OVERLAY_ARROW_ID = "arrow";
    static readonly OVERLAY_CUSTOM_ID = "editableText";
    emitDragStopped() {
      this.pageDragStop.next();
    }

    constructor(private _errorService: ErrorService) {
      this.pageDragStop = new Subject();
      this.pageDragStop$ = this.pageDragStop.asObservable();
      this.pageLoaded = new Subject<any>();
      this.pageLoaded$ = this.pageLoaded.asObservable();
      this.pageLoaded$.subscribe((page:Page) => {
        // setTimeout(() => {
          page.inputConnections.forEach((connection: ConnectionMeta) => {
            this.drawConnection(connection.source, connection.target, connection.label);
          });
          page.items.forEach((pageItem: PageItem) => {
            pageItem.outputConnections.forEach((connection:ConnectionMeta) => {
              this.drawConnection(connection.source, connection.target, connection.label);
            });
          });
        // }, 3000);


      });



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
        this._registerEndpoint(inputItemId);
        console.log(`registered ${inputItemId} endpoint`);
    }

    makeTarget(pageId) {
        this.jsPlumbInstance.makeTarget(pageId,
           {anchor: 'Continuous', 
            endpoint: ['Rectangle', { width: 1, height: 1}], 
            
        });
        this._registerEndpoint(pageId);
    }

    private _registerEndpoint(targetId){ 
        this.endpoints.push(targetId);
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
            Connector: [ConnectorType.BEZIER, {curviness: 50}], Overlays: [
            [  OverlayType.ARROW, {
                location: 1,
                id: FlouService.OVERLAY_ARROW_ID,
                length: 8,
                foldback: 0.9
              }
            ],

              // []
            ], PaintStyle: {strokeWidth: 2, stroke: '#456'},
            DragOptions: {cursor: "move"},
          });

          this.jsPlumbInstance.ready(() => {
            this.jsPlumbInstance.bind(EventListenerType.CLICK, (connection) => {
              // let flouConnection = new ConnectionMeta(connection.sourceId, connection.targetId);
              // let page = this.pages.find(page => page.htmlId == connection.targetId);

              // _.remove(page.inputConnections, (connectionToRemove: ConnectionMeta) => {
              //   return connectionToRemove.target == connection.targetId;
              // });

              // this.pages.forEach((page) => {
              //   page.items.forEach((item: PageItem) => {
              //     _.remove(item.outputConnections, connection => connection.source == connection.sourceId);
              //   });
              // });

              // this.removeConnection(flouConnection);
            });

            this.jsPlumbInstance.bind('connection', (newConnectionInfo:ConnectionMadeEventInfo, mouseEvent: Event) => {
              if (mouseEvent) {
                let targetPage = this.pages.find(page => page.htmlId == newConnectionInfo.targetId);
                const flouConnection = new ConnectionMeta(newConnectionInfo.sourceId, newConnectionInfo.targetId);
                let connection = _.find(targetPage.inputConnections, (connection) => {
                  return connection.source == newConnectionInfo.sourceId && connection.target == newConnectionInfo.targetId;
                });
                if (!connection) {
                  targetPage.inputConnections.push(flouConnection);
                  this.pages.forEach((page) => {
                    let sourceItem = page.items.find(item => item.htmlId == newConnectionInfo.sourceId);
                    if (sourceItem) {
                      sourceItem.outputConnections.push(flouConnection);
                    }
                  });
                }

                this.addConnectionLabel(newConnectionInfo, Strings.EMPTY);
                this.saveAction();
              }
              this.jsPlumbConnections.push(newConnectionInfo);
              this.jsPlumbInstance.repaintEverything();

              // Focus on newly created  item
              const editableInputElRef = (<any>newConnectionInfo.connection.getOverlay(FlouService.OVERLAY_CUSTOM_ID)).canvas;
              editableInputElRef.focus();
            });
            resolve();
          })
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
        const newPage:Page = {  x: cx||x,
            y: cy||y,
            width: pageWidth,
            htmlId: UUID.UUID(),
            title: this._getPageTitle(),
            items: [],
            isActive: true,
            inputConnections: []};
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

    removeItem(item: PageItem, doSaveAction?:boolean){

                let page = this.pages.find((page) => { 
                    return _.find(page.items, {'htmlId':item.htmlId})!=null;
                }); 
                let removedItems = _.remove(page.items, (pageItem: PageItem) => {
                    return item.htmlId == pageItem.htmlId;
                });
                removedItems.forEach((item: PageItem) => {
                    item.outputConnections.forEach( connection => this.removeConnection(connection));
                });
                this._unregisterEndpoint(item.htmlId);
                setTimeout(() =>{ 
                    this.jsPlumbInstance.repaintEverything();
                },0);

                if( doSaveAction ) { 
                    this.saveAction();
                }
            
    }



    _editableTextOverlay(defaultValue: string = ""): OverlaySpec {
     return [OverlayType.CUSTOM, {
        create:(component)=>{
          const input = document.createElement('input');
          input.type = Strings.INPUT_TYPE_TEXT;
          input.value = defaultValue;
          input.classList.add("input-item__label-edit");
          input.addEventListener(EventListenerType.FOCUS_OUT, (ev: Event) => {
            const updatedLabel = (<any>ev.target).value;
            let connectionInfo: ConnectionMeta = this.findConnectionMeta(component.sourceId, component.targetId);
            connectionInfo.label = updatedLabel;
             this.saveAction();
          });
          return input;
        },
        location:[0.5],
        id: FlouService.OVERLAY_CUSTOM_ID
      }];
    }

    addConnectionLabel(jsPlumbConnection: ConnectionMadeEventInfo, label: string) {
      (<any>jsPlumbConnection.connection).addOverlay(this._editableTextOverlay(label))
    }

    drawConnection(sourceHtmlId: string, targetHtmlId: string, label: string) {
        if( _.includes( this.endpoints, sourceHtmlId) &&  _.includes( this.endpoints, targetHtmlId)) {
            this.jsPlumbInstance.connect({source: sourceHtmlId, target: targetHtmlId, overlays:[
                this._editableTextOverlay(label)
              ]});
        }
    }

    restorePage(pageToRestore: Page, doSaveAction?: boolean) {
        //FIXME:: Hack . if I will not change ID then it will be an issue 
        //after trying reconnect connections - pages connections will break;
        this._fixHtmlIds(pageToRestore);
        this.pages.push(pageToRestore);
        if( doSaveAction ) { 
            this.saveAction();
        }
    }


    findConnectionMeta(sourceId, targetId): ConnectionMeta {
      for( let pageIndex = 0; pageIndex < this.pages.length; pageIndex++) {
        let searchResult = _.find(this.pages[pageIndex].inputConnections, (inputConnection) => {
         return inputConnection.target ==targetId && inputConnection.source == sourceId;
        });

        if( searchResult ) {
          return searchResult;
        }
      }
      return null;
    }

    private _fixHtmlIds(page: Page) {
        page.htmlId = UUID.UUID();
        page.inputConnections.forEach((connection) => {
            connection.target = page.htmlId;
        });

        page.items.forEach((pageItem: PageItem) => {
            pageItem.htmlId = UUID.UUID();
            pageItem.outputConnections.forEach((connection:ConnectionMeta) => {
                connection.source = pageItem.htmlId;
            });
        });
        return page;
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

    private _unregisterEndpoint(source) { 
        _.remove(this.endpoints, (endpoint)  => {
             return endpoint == source;
        });
    }

    export() { 
        return JSON.stringify( this.pages );
    }

    import(importedPages: Page[]): Promise<any> {
      const result = new Promise<any>((resolve, reject) => {
        this.jsPlumbConnections = [];
        this.endpoints = [];
        this.initJsPlumb().then(() => {
          this.pages = importedPages;
          resolve()
        });
      });
      return result
    }

    removeConnection(connection: ConnectionMeta, doSaveAction?:boolean) {
        let connectionsToRemove = _.remove( this.jsPlumbConnections, jsPlumbConnection => jsPlumbConnection.sourceId == connection.source && jsPlumbConnection.targetId == connection.target );
           
            connectionsToRemove.forEach((connectionToRemove) => { 
                try {
                    this.jsPlumbInstance.deleteConnection(connectionToRemove.connection);
                } catch ( e ) { 
                    console.error('can\'t remove connection');
                }
            });
            if( doSaveAction ) { 
                this.saveAction();
            }
    }
    

    private _clearPageFromConnections(page: Page) { 
        page.inputConnections.forEach((connection:ConnectionMeta) => {
            this.removeConnection(connection);
        });
        let numberOfUnregisteredEndpoints = 0;
        page.items.forEach((item) => {
            item.outputConnections.forEach((connection:ConnectionMeta) => {
                this.removeConnection(connection);
                numberOfUnregisteredEndpoints++;
            });
            this._unregisterEndpoint(item.htmlId);
        });
        let numberOfCleanedConnections = 0;
        this.pages.forEach((pageToClean)=> { 
            pageToClean.items.forEach((pageItem:PageItem) => { 
              let cleanedConnections = _.remove( pageItem.outputConnections, connection => connection.target == page.htmlId );
              numberOfCleanedConnections+=cleanedConnections.length;
            });
        });
        console.log( `Cleaned ${numberOfCleanedConnections} connections`);
        this._unregisterEndpoint(page.htmlId);
        numberOfUnregisteredEndpoints++;
        console.log(`Unregistered ${numberOfUnregisteredEndpoints} endpoints after page deletion`);
    }

    removeAllPages() { 
        this.pages.forEach((page: Page) => { 
            this._clearPageFromConnections(page);
        });
        this.pages.length = 0;
    }

    removePage(page: Page, doSaveAction?:boolean):Promise<Page> {
        let result = new Promise<Page>((resolve,reject)=>{
        try { 
            
            this._clearPageFromConnections(page);
            let removedPage:Page = _.first(_.remove(this.pages, (currentPage) => { 
                return currentPage.htmlId == page.htmlId;
            }));
            resolve(removedPage);
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

    addItem(page: Page, type?: string, doSaveAction?: boolean) {
        let item: PageItem = null;
        const htmlId = UUID.UUID();
        if ( !type ) {
            item = {position: 0, type: 'input', title: `Item ${page.items.length + 1}`,
                 htmlId: htmlId, outputConnections: [], created: Date.now()};
        } else {
            item = {position: 0, type: type, title: `Item ${page.items.length + 1}`,
                 htmlId: htmlId, outputConnections: [], created: Date.now()};
        }
        page.items.push(item);
        if( doSaveAction ) { 
            this.saveAction();
        }
    }

    

}
