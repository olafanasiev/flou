import { Component, OnInit, Input, ViewEncapsulation,
  AfterViewInit, ViewContainerRef, ViewChildren, QueryList, ElementRef, ViewChild } from '@angular/core';
import { FlouService } from '../../services/flou.service';
import { Page } from '../models/page';
import { InputItemComponent } from '../input-item/input-item.component';
declare var $: any;
@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PageComponent implements OnInit, AfterViewInit {
  @ViewChild('itemTypePanel') itemTypePanel: ElementRef;

  @Input()
  page: Page;
  @ViewChildren(InputItemComponent) items: QueryList<InputItemComponent>;
  constructor(private _flouService: FlouService, private _viewRef: ViewContainerRef) { }
  editMode = false;

  ngOnInit() {
  }

  ngAfterViewInit() {
    this._viewRef.element.nativeElement.id = this.page.htmlId;
    this.items.changes.subscribe((updatedItems: QueryList<InputItemComponent>) => {
      updatedItems.forEach((item: InputItemComponent) => {
        if ( !item.isJsPlumbed ) {
            this._flouService.getJsPlumbInstance().makeSource( 'anchor-' + item.htmlId, {anchor: ['RightMiddle'],
                parent: $(this._viewRef.element.nativeElement), endpoint: ['Rectangle', { width: 1, height: 1}] });
                item.isJsPlumbed = true;
        }
      });
    });
    $(this._viewRef.element.nativeElement).draggable({
      drag: () => {
        this._flouService.getJsPlumbInstance().repaintEverything();
      }
    });
    this._flouService.getJsPlumbInstance().makeTarget(this.page.htmlId,
      {anchor: 'Continuous', endpoint: ['Rectangle', { width: 1, height: 1}]
    });
  }


  addItem() {
     this._flouService.addItem(this.page);
  }

}
