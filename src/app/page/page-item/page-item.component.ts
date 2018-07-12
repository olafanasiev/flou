import { PageItem } from '../../models/page-item';
import { Input } from '@angular/core';

export abstract class PageItemComponent {
  @Input()
  data: PageItem;
  position: number;
  type: string;
  constructor() { }

}
