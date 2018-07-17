import { Injectable } from '@angular/core';
import { jsPlumb } from 'jsplumb';
import { Page } from '../app/models/page';
import { PageItem } from '../app/models/page-item';

@Injectable()
export class FlouService {
    jsPlumbInstance;
    pages: Page[];
    pageCounts = 0;

    constructor() {
        this.jsPlumbInstance = jsPlumb.getInstance();
        this.pages = [];
    }

    getPages() {
        return this.pages;
    }


    addPage() {
        this.pages.push({  x: 0,
            y: 0,
            title: this._getPageTitle(),
            items: []});
    }

    private _getPageTitle() {
        this.pageCounts++;
        return `Page ${this.pageCounts}`;
    }

    addItem(page: Page, type?: string) {
        let item: PageItem = null;
        if ( !type ) {
            item = {position: 0, type: 'input', title: `Item ${page.items.length + 1}`};
        } else {
            item = {position: 0, type: type, title: `Item ${page.items.length + 1}`};
        }

        page.items.push(item);
    }
}
