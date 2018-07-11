import { Component, AfterViewInit } from '@angular/core';
import { jsPlumb } from 'jsplumb';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'app';
  jsPlumbInstance;

  ngAfterViewInit() {
    this.jsPlumbInstance = jsPlumb.getInstance();
    const endpoint1 = this.jsPlumbInstance.addEndpoint('page1'),
        endpoint2 = this.jsPlumbInstance.addEndpoint('page2');
        this.jsPlumbInstance.connect({ source: endpoint1, target: endpoint2 });
        this.jsPlumbInstance.draggable('page1');
        this.jsPlumbInstance.draggable('page2');
  }
}
