import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { PageComponent } from './page/page.component';
import { ButtonItemComponent } from './button-item/button-item.component';
import { ChoiceItemComponent } from './choice-item/choice-item.component';
import { TextItemComponent } from './text-item/text-item.component';
import { InputItemComponent } from './input-item/input-item.component';
import { FlouService } from '../services/flou.service';
import { SharedModule } from './shared/shared.module';
import { EditableTitleComponent } from './editable-title/editable-title.component';


@NgModule({
  declarations: [
    AppComponent,
    PageComponent,
    ButtonItemComponent,
    ChoiceItemComponent,
    TextItemComponent,
    InputItemComponent,
    EditableTitleComponent
  ],
  imports: [
    BrowserModule, SharedModule
  ],
  providers: [FlouService],
  bootstrap: [AppComponent]
})
export class AppModule { }
