import { Injectable } from '@angular/core';
import { jsPlumb } from 'jsplumb';
import { Page } from '../app/models/page';
import { PageItem } from '../app/models/page-item';
declare var $: any;
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

    // this.jsPlumbInstance = jsPlumb.getInstance();
    // const endpoint1 = this.jsPlumbInstance.addEndpoint('page1'),
    //     endpoint2 = this.jsPlumbInstance.addEndpoint('page2');
    //     this.jsPlumbInstance.connect({ source: endpoint1, target: endpoint2 });
    //     this.jsPlumbInstance.draggable('page1');
    //     this.jsPlumbInstance.draggable('page2');
    addPage() {
        this.pages.push({  x: 0,
            y: 0,
            htmlId: `page-${this.pageCounts}`,
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
            item = {position: 0, type: 'input', title: `Item ${page.items.length + 1}`,
            htmlId: `${page.htmlId}--item-${page.items.length}`};
        } else {
            item = {position: 0, type: type, title: `Item ${page.items.length + 1}`, htmlId: `${page.htmlId}--item-${page.items.length}`};
        }
        page.items.push(item);
        setTimeout(() => {
        this.jsPlumbInstance.addEndpoint(item.htmlId);
        $(`#${page.htmlId} .page__items`).sortable({
            stop: function(event, ui) {
                this.jsPlumbInstance.recalculateOffsets($(ui.item).parents('.draggable'));
                this.jsPlumbInstance.repaintEverything();
            }
        });
        }, 0);
    }
}
