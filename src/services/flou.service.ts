import { Injectable } from '@angular/core';
import { Page } from '../app/models/page';
import { UUID } from 'angular2-uuid';
import { PageItem } from '../app/models/page-item';
import * as _ from 'lodash';
import { Subject } from 'rxjs/Subject';
import { Observable, Subscription } from 'rxjs';
declare var $: any;
declare var jsPlumb, jsPlumbInstance: any;

@Injectable()
export class FlouService {
    jsPlumbInstance;
    pages: Page[];
    pageCounts = 0;
    constructor() {
        this.jsPlumbInstance = jsPlumb.getInstance({Container: document.getElementById('pages')});
        this.jsPlumbInstance.importDefaults({Connector: ['Bezier', { curviness: 50 }]});
        this.pages = [];
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

        _.find(this.pages, {x:x, y:y})
        const newPage = {  x: x,
            y: y,
            width: pageWidth,
            htmlId: UUID.UUID(),
            title: this._getPageTitle(),
            items: [],
            isActive: true};
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

    addItem(page: Page, type?: string) {
        let item: PageItem = null;
        const htmlId = UUID.UUID();
        if ( !type ) {
            item = {position: 0, type: 'input', title: `Item ${page.items.length + 1}`,
                 htmlId: htmlId};
        } else {
            item = {position: 0, type: type, title: `Item ${page.items.length + 1}`, htmlId: htmlId};
        }
        page.items.push(item);
    }
}
