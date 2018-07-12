import { Injectable } from '@angular/core';
import { jsPlumb } from 'jsplumb';
import { Page } from '../app/models/page';

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
        const pageItems = [];
        this.pages.push({  x: 0,
            y: 0,
            title: this._getPageTitle(),
            items: pageItems });
    }

    private _getPageTitle() {
        this.pageCounts++;
        return `Page ${this.pageCounts}`;
    }

    addItem(page: Page, type?: string) {
        let item: PageItem = null;
        if ( !type ) {
            item = {position: 0, type: 'input'};
        } else {
            item = {position: 0, type: type};
        }

        page.items.push(item);
    }
}
