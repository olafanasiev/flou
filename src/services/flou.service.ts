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
    anEndpointSource = {
        endpoint: 'Rectangle',
        isSource: true,
        isTarget: false,
        maxConnections: 1,

        anchor: [1, 0, 1, 0]
    };

    anEndpointDestination = {
        endpoint: 'Dot',
        isSource: false,
        isTarget: true,
        maxConnections: 1,

        anchor: [0, 1, -1, 0]
    };

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
            // this.jsPlumbInstance.draggable(newPage.htmlId);
            // $(`#${newPage.htmlId}`).draggable();
        } , 0 );
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
       this.jsPlumbInstance.addEndpoint(item.htmlId,
       {isSource: true,
        isTarget: true,
        anchor: ['RightMiddle']});
    //    const e2 = this.jsPlumbInstance.addEndpoint(item.htmlId);
    //    this.jsPlumbInstance.connect({ source: e1, target: e2 });
        // $(`#${page.htmlId} .page__items`).sortable({
        //     stop: function(event, ui) {
        //         this.jsPlumbInstance.recalculateOffsets($(ui.item).parents('.draggable'));
        //         this.jsPlumbInstance.repaintEverything();
        //     }
        // });
        }, 0);
    }
}
