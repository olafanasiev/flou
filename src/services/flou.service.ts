import { Injectable } from '@angular/core';
import { Page } from '../app/models/page';
import { UUID } from 'angular2-uuid';
import { PageItem } from '../app/models/page-item';
import * as _ from 'lodash';
import { Connection } from '../app/models/connection';
import { ErrorService } from './error.service';
import { AppState } from '../app/models/app-state';
declare var $: any;
declare var jsPlumb,jsPlumbInstance: any;

@Injectable()
export class FlouService {
    jsPlumbInstance;
    pages: Page[];
    pageCounts = 0;
    jsPlumbConnections = [];
    states:AppState[] =  [];
    htmlId
    constructor(private _errorService: ErrorService) {
        this.jsPlumbInstance = jsPlumb.getInstance({Container: document.getElementById('pages')});
        this.jsPlumbInstance.importDefaults({Connector: ['Bezier', { curviness: 50 }]});
        this.pages = [];
        this.jsPlumbInstance.bind('connection', (newConnectionInfo) => {
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
        const pageWidth = 200;
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

    private _getPageTitle() {
        this.pageCounts++;
        return `Page ${this.pageCounts}`;
    }

    removeItem(page: Page, htmlId ){ 
        _.remove( 
                _.first( 
                    _.filter( this.pages, {htmlId: page.htmlId })).items, (item: PageItem ) => {
                        return item.htmlId == htmlId;
        });
    }

    drawConnection(source, target) { 
        this.jsPlumbInstance.connect({source: source, target: target});
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


    removeConnection(connection: Connection) {
        let connectionsToRemove = _.remove( this.jsPlumbConnections, jsPlumbConnection => jsPlumbConnection.sourceId == connection.source && jsPlumbConnection.targetId == connection.target );
           
            connectionsToRemove.forEach((connectionToRemove) => { 
                this.jsPlumbInstance.deleteConnection(connectionToRemove.connection);
            });
    }
    
    removePage(page: Page):Promise<Page> {
        let result = new Promise<Page>((resolve,reject)=>{
        try { 
          
            
            page.inputConnections.forEach((connection:Connection) => { 
                this.removeConnection(connection);
            });
            page.items.forEach((item) => {
                item.outputConnections.forEach((connection:Connection) => {
                    this.removeConnection(connection);
                });
            })
            let removedPage:Page = _.first(_.remove(this.pages, (currentPage) => { 
                return currentPage.htmlId == page.htmlId;
            }));
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
                 htmlId: htmlId, outputConnections: []};
        } else {
            item = {position: 0, type: type, title: `Item ${page.items.length + 1}`, htmlId: htmlId, outputConnections: []};
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

    saveState( stateName ):Promise<AppState[]> { 
        return new Promise<AppState[]>((resolve, reject) => {
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
                                            data: this.pages};
                  this.states.push(newAppState);
              } else { 
                  existingState.data = this.pages;
                  existingState.updated = Date.now();
              }
              localStorage.setItem("flou", JSON.stringify(this.states));
              resolve(this.states);
            } catch( e ) { 
                reject(e);
            }
        });
        
    }
    
    loadState( stateUid ) { 

    }
}
