import { Injectable } from '@angular/core';
import { jsPlumb, jsPlumbInstance } from 'jsplumb';
import { Page } from '../app/models/page';
import { UUID } from 'angular2-uuid';
import { PageItem } from '../app/models/page-item';
declare var $: any;
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
    addPage() {
        const newPage = {  x: 0,
            y: 0,
            htmlId: UUID.UUID(),
            title: this._getPageTitle(),
            items: []};
            this.pages.push(newPage);
    }

    private _getPageTitle() {
        this.pageCounts++;
        return `Page ${this.pageCounts}`;
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
