import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { PageComponent } from './page/page.component';
import { InputItemComponent } from './input-item/input-item.component';
import { FlouService } from '../services/flou.service';
import { SharedModule } from './shared/shared.module';
import { InputItemService } from '../services/input-item.service';
import { ItemContextMenuComponent } from './item-context-menu/item-context-menu.component';
import { ClickOutsideModule } from 'ng-click-outside';
import { PageService } from '../services/page.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ItemPanelComponent } from './item-panel/item-panel.component';
@NgModule({
  declarations: [
    AppComponent,
    PageComponent,
    InputItemComponent,
    ItemContextMenuComponent,
    ItemPanelComponent
  ],
  imports: [
    ClickOutsideModule, BrowserModule, SharedModule, BrowserAnimationsModule
  ],
  providers: [FlouService, InputItemService, PageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
