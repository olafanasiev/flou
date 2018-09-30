import { Injectable } from '@angular/core';
import { Page } from '../app/models/page';
import { UUID } from 'angular2-uuid';
import { PageItem } from '../app/models/page-item';
import * as _ from 'lodash';
import { Connection } from '../app/models/connection';
import { ErrorService } from './error.service';
import { AppState } from '../app/models/app-state';
import { Subject, Observable } from 'rxjs';
import { PageComponent } from '../app/page/page.component';
declare var $: any;
declare var jsPlumb,jsPlumbInstance: any;

@Injectable()
export class FlouService {
    jsPlumbInstance;
    pages: Page[];
    pageCounts = 0;
    jsPlumbConnections = [];
    states:AppState[] =  [];
    stateLoaded: Subject<any>;
    stateLoaded$: Observable<any>;
    pageLoaded: Subject<any>;
    pageLoaded$: Observable<any>;
    endpoints  = [];
    constructor(private _errorService: ErrorService) {
        this.stateLoaded = new Subject<any>();
        this.stateLoaded$ = this.stateLoaded.asObservable();
        this.pageLoaded = new Subject<any>();
        this.pageLoaded$ = this.pageLoaded.asObservable();
        this.pages = [];

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
        ]});
            
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
            }
            this.jsPlumbConnections.push(newConnectionInfo);
            this.jsPlumbInstance.repaintEverything();
        });  
    }

    getJsPlumbInstance() {
        return this.jsPlumbInstance;
    }

    getPages() {
        return this.pages;
    }

    doesPageIsOverlayingAnotherPage(x,y) {
      return  _.find(this.pages, {x:x, y:y}) != null;
    }

    addPage() {
        this.pages.forEach((page) => {
            page.isActive = false;
        });
        const pageWidth = 230;
        const defaultPageHeight = 268;
        const halfPageHeight = defaultPageHeight / 2;
        const halfPageWidth = pageWidth / 2;
        let y = (window.innerHeight / 2 + window.scrollY) - halfPageHeight;
        let x = (window.innerWidth / 2 + window.scrollX) - halfPageWidth;

        while( this.doesPageIsOverlayingAnotherPage(x,y) ){ 
            //we are doing shifting page
            x=x+15;
            y=y+15;
        }
        const newPage:Page = {  x: x,
            y: y,
            width: pageWidth,
            htmlId: UUID.UUID(),
            title: this._getPageTitle(),
            items: [],
            isActive: true,
            inputConnections: []};
            this.pages.push(newPage);
    }

    enableDragging(htmlElRef, options?:any) { 
        if( options ) {
            this.jsPlumbInstance.draggable(htmlElRef, options );
        } else { 
            this.jsPlumbInstance.draggable(htmlElRef);
        }
        
    }

    disableDragging(htmlElRef) {
        this.jsPlumbInstance.draggable(htmlElRef, {disabled: true});
    }

    private _getPageTitle() {
        return `Page ${this.pages.length + 1}`;
    }

    removeItem(item: PageItem){ 
                let removedItems = _.remove(item.page.items, (pageItem: PageItem) => {
                    return item.htmlId == pageItem.htmlId;
                });
                removedItems.forEach((item: PageItem) => {
                    item.outputConnections.forEach( connection => this.removeConnection(connection));
                });
                setTimeout(() =>{ 
                    this.jsPlumbInstance.repaintEverything();
                },0);
    }

    drawConnection(source, target) {
        if( _.includes( this.endpoints, source) &&  _.includes( this.endpoints, target)) {
            this.jsPlumbInstance.connect({source: source, target: target});
        }
    }

    restorePage(pageToRestore: Page) {
        //FIXME:: Hack . if I will not change ID then it will be an issue 
        //after trying reconnect connections - pages connections will break;
        pageToRestore.htmlId = UUID.UUID();
        pageToRestore.inputConnections.forEach((connection) => {
            connection.target = pageToRestore.htmlId;
        });

        pageToRestore.items.forEach((pageItem: PageItem) => {
            pageItem.htmlId = UUID.UUID();
            pageItem.outputConnections.forEach((connection:Connection) => {
                connection.source = pageItem.htmlId;
            });
        });
        
        this.pages.push(pageToRestore);
    }


    private _unregisterEndpoint(source) { 
        _.remove(this.endpoints,endpoint => endpoint == source);
    }


    removeConnection(connection: Connection) {
        let connectionsToRemove = _.remove( this.jsPlumbConnections, jsPlumbConnection => jsPlumbConnection.sourceId == connection.source && jsPlumbConnection.targetId == connection.target );
           
            connectionsToRemove.forEach((connectionToRemove) => { 
                try {
                        this.jsPlumbInstance.deleteConnection(connectionToRemove.connection);
                } catch ( e ) { 
                    console.error('can\'t remove connection');
                }
            });
    }
    
    removePage(page: Page):Promise<Page> {
        let result = new Promise<Page>((resolve,reject)=>{
        try { 
            
            page.inputConnections.forEach((connection:Connection) => { 
                this.removeConnection(connection);
            });
            let numberOfUnregisteredEndpoints = 0;
            page.items.forEach((item) => {
                item.outputConnections.forEach((connection:Connection) => {
                    this.removeConnection(connection);
                    this._unregisterEndpoint(item.htmlId);
                    numberOfUnregisteredEndpoints++;
                });
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
            let removedPage:Page = _.first(_.remove(this.pages, (currentPage) => { 
                return currentPage.htmlId == page.htmlId;
            }));
            console.log(`Unregistered ${numberOfUnregisteredEndpoints} endpoints after page deletion`)
            resolve(removedPage);
        } catch( e ) { 
            this._errorService.onError.next(e);
            reject(e);
        }
        
        });
      return result;
    }

    addItem(page: Page, type?: string) {
        let item: PageItem = null;
        const htmlId = UUID.UUID();
        if ( !type ) {
            item = {position: 0, type: 'input', title: `Item ${page.items.length + 1}`,
                 htmlId: htmlId, page: page, outputConnections: []};
        } else {
            item = {position: 0, page: page, type: type, title: `Item ${page.items.length + 1}`, htmlId: htmlId, outputConnections: []};
        }
        page.items.push(item);
    }
    
    loadApp():Promise<AppState[]> {
        let result = new Promise<AppState[]>((resolve, reject ) => {
            try { 
                let appAsStr = localStorage.getItem("flou");
                if( appAsStr ) { 
                    this.states = JSON.parse(appAsStr); 
                } else {
                    this.states = [];
                }
                resolve(this.states);
            } catch( e ) { 
                this._errorService.onError.next(e);
                reject(e);
            }
        });
     return result;
    }

    saveState( stateName ):Promise<AppState> { 
        return new Promise<AppState>((resolve, reject) => {
            try {
            let existingState = _.find( this.states, (state: AppState) => {
                return  state.name == stateName;
              });
              if( !existingState ) { 
                  let currentTime = Date.now();
                  let newAppState:AppState = { uid: UUID.UUID(), 
                                            created: currentTime, 
                                            updated: currentTime,
                                            name : stateName,
                                            data: _.cloneDeep(this.pages)};
                  this.states.push(newAppState);
                  resolve(newAppState);
              } else { 
                  existingState.data = _.cloneDeep(this.pages);
                  existingState.updated = Date.now();
                  resolve(existingState);
              }
              localStorage.setItem("flou", JSON.stringify(this.states));
            } catch( e ) { 
                console.error(e);
                reject(e);
            }
        });
        
    }
    
    loadState( state: AppState ) { 
        this.jsPlumbConnections = [];
        this.endpoints = [];
        this.initJsPlumb();
        this.pages = _.cloneDeep(state.data);
        this.stateLoaded.next(this.pages);
    }
}
