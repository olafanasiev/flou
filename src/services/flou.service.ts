import { Injectable } from '@angular/core';
import { Page } from '../app/models/page';
import { UUID } from 'angular2-uuid';
import { PageItem } from '../app/models/page-item';
import * as _ from 'lodash';
import { Connection } from '../app/models/connection';
import { ErrorService } from './error.service';
import { Subject, Observable } from 'rxjs';
import { interval } from 'rxjs';
import { Action, steps } from '../app/models/action';
declare var jsPlumb: any;
export namespace LastAction { 
    export const undo = 'undo';
    export const redo = 'redo';
    export const action = 'action';
}
@Injectable()
export class FlouService {
    jsPlumbInstance;
    pages: Page[];
    jsPlumbConnections = [];
    pageLoaded: Subject<any>;
    pageLoaded$: Observable<any>;
    pageDragStop$: Observable<any>;
    pageDragStop: Subject<any>;
    endpoints  = [];
    currentAction:Action;
    lastOperation = '';
    DEFAULT_STATE_KEY = 'default_state';
    LAST_HEIGHT = "last_height";
    emitDragStopped() {
      this.pageDragStop.next();
    }

    constructor(private _errorService: ErrorService) {
      this.pageDragStop = new Subject();
      this.pageDragStop$ = this.pageDragStop.asObservable();
      this.pageLoaded = new Subject<any>();
      this.pageLoaded$ = this.pageLoaded.asObservable();

      this.pageLoaded$.subscribe((page:Page) => {
        page.inputConnections.forEach((connection: Connection) => {
          this.drawConnection(connection.source, connection.target);
        });
        page.items.forEach((pageItem: PageItem) => {
          pageItem.outputConnections.forEach((connection:Connection) => {
            this.drawConnection(connection.source, connection.target);
          });
        });

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

    loadLastAppState() {
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
        this.import(this.pages);
      }
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

    initJsPlumb() { 
        if( this.jsPlumbInstance ) { 
            this.jsPlumbInstance.reset();
        } else { 
            this.jsPlumbInstance = jsPlumb.getInstance({Container: document.getElementById('pages')});
        }
        this.jsPlumbInstance.importDefaults({Connector: ['Bezier', { curviness: 50 }], Overlays: [
            [ "Arrow", { 
                location:1,
                id:"arrow",
                length:8,
                foldback:0.9
            } ]
        ], PaintStyle: { strokeWidth: 2, stroke: '#456'},
           DragOptions : { cursor: "move" },
        });

        this.jsPlumbInstance.bind('click', (connection) => {
          let flouConnection = new Connection(connection.sourceId, connection.targetId);
          let page = this.pages.find( page => page.htmlId == connection.targetId);
          
          _.remove(page.inputConnections, (connectionToRemove:Connection) => { 
                return connectionToRemove.target == connection.targetId;
          });

          this.pages.forEach((page ) => { 
              page.items.forEach((item: PageItem) => {
                _.remove( item.outputConnections, connection => connection.source == connection.sourceId);
              });
          });
          
          this.removeConnection(flouConnection);
        })
        
        this.jsPlumbInstance.bind('connection', (newConnectionInfo, mouseEvent) => {
            if( mouseEvent ) { 
                let targetPage = this.pages.find( page => page.htmlId == newConnectionInfo.targetId );
                let flouConnection =  new Connection(newConnectionInfo.sourceId, newConnectionInfo.targetId)
                let connection = _.find( targetPage.inputConnections, (connection) => {
                return connection.source == newConnectionInfo.sourceId && connection.target == newConnectionInfo.targetId;
                });    
                if(!connection) {
                    targetPage.inputConnections.push(flouConnection);
                    this.pages.forEach((page) => {
                        let sourceItem = page.items.find( item => item.htmlId == newConnectionInfo.sourceId );
                        if( sourceItem ) { 
                            sourceItem.outputConnections.push(flouConnection);
                        }
                    });
                }
                this.saveAction();
            }
            this.jsPlumbConnections.push(newConnectionInfo);
            this.jsPlumbInstance.repaintEverything();
        });  
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

    drawConnection(source, target) {
        if( _.includes( this.endpoints, source) &&  _.includes( this.endpoints, target)) {
            this.jsPlumbInstance.connect({source: source, target: target});
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

    private _fixHtmlIds(page: Page) {
        page.htmlId = UUID.UUID();
        page.inputConnections.forEach((connection) => {
            connection.target = page.htmlId;
        });

        page.items.forEach((pageItem: PageItem) => {
            pageItem.htmlId = UUID.UUID();
            pageItem.outputConnections.forEach((connection:Connection) => {
                connection.source = pageItem.htmlId;
            });
        });
        return page;
    }

    private _rebuildPages() {
        this.removeAllPages();
        this.initJsPlumb();
        let parsedPages = JSON.parse(this.currentAction.pages);
        this.pages.push(...parsedPages);
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

    import(importedPages: Page[]) {
        this.jsPlumbConnections = [];
        this.endpoints = [];
        this.initJsPlumb();
        this.pages = importedPages;
    }

    removeConnection(connection: Connection, doSaveAction?:boolean) {
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
        page.inputConnections.forEach((connection:Connection) => { 
            this.removeConnection(connection);
        });
        let numberOfUnregisteredEndpoints = 0;
        page.items.forEach((item) => {
            item.outputConnections.forEach((connection:Connection) => {
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
