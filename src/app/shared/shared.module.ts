import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SortableComponent} from "./sortable-component/sortable.component";

@NgModule({
  imports: [
    CommonModule,
  ],
  exports: [
    SortableComponent
  ],
  declarations: [SortableComponent]
})
export class SharedModule { }
