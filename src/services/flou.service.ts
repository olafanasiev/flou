import { Injectable } from '@angular/core';
import { jsPlumb, jsPlumbInstance } from 'jsplumb';
import { Page } from '../app/models/page';
import { PageItem } from '../app/models/page-item';
declare var $: any;
@Injectable()
export class FlouService {
    jsPlumbInstance;
    pages: Page[];
    pageCounts = 0;
    constructor() {
        this.jsPlumbInstance = jsPlumb.getInstance({Container: document.getElementById('pages')});
        this.pages = [];
    }

    getPages() {
        return this.pages;
    }
    addPage() {
        const newPage = {  x: 0,
            y: 0,
            htmlId: `page-${this.pageCounts}`,
            title: this._getPageTitle(),
            items: []};
            this.pages.push(newPage);
            setTimeout(() => {
                $(`#${newPage.htmlId}`).draggable({
                    drag: (e, el) => {
                        this.jsPlumbInstance.revalidate(el.helper.attr('id')); // Note that it will only repaint the dragged element
                    },
                });
                // this.jsPlumbInstance.draggable(newPage.htmlId);
        } , 0 );
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
