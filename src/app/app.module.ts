import {BrowserModule} from '@angular/platform-browser';
import {ApplicationRef, Injector, NgModule} from '@angular/core';
import {SnackbarModule} from 'ngx-snackbar';
import {AppComponent} from './app.component';
import {PageComponent} from './page/page.component';
import {InputItemComponent} from './input-item/input-item.component';
import {FlouService} from '../services/flou.service';
import {SharedModule} from './shared/shared.module';
import {InputItemService} from '../services/input-item.service';
import {ItemContextMenuComponent} from './item-context-menu/item-context-menu.component';
import {ClickOutsideModule} from 'ng-click-outside';
import {PageService} from '../services/page.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ErrorService} from '../services/error.service';
import {FormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import {AppDialogComponent} from './app-dialog/app-dialog.component';
import {HttpClientModule} from '@angular/common/http';
import {ThemingService} from './theming.service';
import {TestComponent} from './test/test.component';
import {EditableTextOverlayComponent} from './editable-text-overlay/editable-text-overlay.component';
import {createCustomElement} from '@angular/elements';

@NgModule({
  declarations: [
    AppComponent,
    PageComponent,
    InputItemComponent,
    ItemContextMenuComponent,
    AppDialogComponent,
    TestComponent,
    EditableTextOverlayComponent
  ],
  imports: [
    BrowserAnimationsModule, ClickOutsideModule, HttpClientModule, FormsModule, NgSelectModule, SnackbarModule.forRoot(), BrowserModule, SharedModule
  ],
  entryComponents: [EditableTextOverlayComponent, AppComponent],
  providers: [FlouService, ThemingService, InputItemService, PageService, ErrorService],
  // bootstrap: [AppComponent]
})
export class AppModule {
  constructor(private injector: Injector) {
  }

  ngDoBootstrap(appRef: ApplicationRef) {
    const editableTextOverlay = createCustomElement(EditableTextOverlayComponent,
      {injector: this.injector});
    console.log('HERE ');
    customElements.define('editable-text-overlay', editableTextOverlay);
    appRef.bootstrap(AppComponent);
  }
}
