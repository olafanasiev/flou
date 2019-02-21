import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SnackbarModule } from 'ngx-snackbar';
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
import { ErrorService } from '../services/error.service';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppDialogComponent } from './app-dialog/app-dialog.component';
import { HttpClientModule } from '@angular/common/http';
@NgModule({
  declarations: [
    AppComponent,
    PageComponent,
    InputItemComponent,
    ItemContextMenuComponent,
    AppDialogComponent,
  ],
  imports: [
    BrowserAnimationsModule, ClickOutsideModule,HttpClientModule, FormsModule, NgSelectModule, SnackbarModule.forRoot(), BrowserModule, SharedModule
  ],
  providers: [FlouService, InputItemService, PageService, ErrorService],
  bootstrap: [AppComponent]
})
export class AppModule { }
