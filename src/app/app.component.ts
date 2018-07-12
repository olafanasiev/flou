import { Component, AfterViewInit } from '@angular/core';
import { FlouService } from '../services/flou.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'app';
  pages = [];

  constructor(private flouService: FlouService) {}
  ngAfterViewInit() {
    this.pages =  this.flouService.getPages();
  }

  addPage() {
    this.flouService.addPage();
  }
}
