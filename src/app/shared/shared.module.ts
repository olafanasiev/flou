import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    FlexLayoutModule
  ],
  exports: [
    MatButtonModule,
    FlexLayoutModule
  ],
  declarations: []
})
export class SharedModule { }
