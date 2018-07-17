import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FlexLayoutModule } from '@angular/flex-layout';

export const modules = [
  MatButtonModule,
  MatInputModule,
  FlexLayoutModule
];
@NgModule({
  imports: [
    CommonModule,
    modules
  ],
  exports: [
    modules
  ],
  declarations: []
})
export class SharedModule { }
