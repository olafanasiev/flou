import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { PageComponent } from './page/page.component';
import { InputItemComponent } from './input-item/input-item.component';
import { FlouService } from '../services/flou.service';
import { SharedModule } from './shared/shared.module';


@NgModule({
  declarations: [
    AppComponent,
    PageComponent,
    InputItemComponent,
  ],
  imports: [
    BrowserModule, SharedModule
  ],
  providers: [FlouService],
  bootstrap: [AppComponent]
})
export class AppModule { }
