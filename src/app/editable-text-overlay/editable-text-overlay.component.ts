import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {FlouService} from '../../services/flou.service';
import {LabelMeta} from '../models/label-meta';

@Component({
  selector: 'editable-text-overlay',
  templateUrl: './editable-text-overlay.component.html',
  styleUrls: ['./editable-text-overlay.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class EditableTextOverlayComponent implements OnInit {
  @Input()
  labelMeta: LabelMeta;
  constructor( private _flouService: FlouService) {

  }

  ngOnInit() {
    console.log(this.labelMeta);
  }
  // _generateEditTemplate(labelMeta: LabelMeta, jsPlumbConnection: any) {
  //   const div = document.createElement('div');
  //   const labelDots = document.createElement('div');
  //   const removeIcon = document.createElement('div');
  //
  //   labelDots.classList.add(FlouService.OVERLAY_CLASS_DOTS);
  //
  //   const textarea = document.createElement('textarea');
  //   textarea.value = labelMeta.label;
  //   textarea.classList.add(FlouService.OVERLAY_EDIT_CLASS);
  //   this._setLabelHeight(textarea);
  //
  //
  //   const focusOutHandler = (ev: Event) => {
  //     const textArea = (<HTMLTextAreaElement>ev.target);
  //     labelMeta.label = textArea.value;
  //     textAreaChanged();
  //     this.saveAction();
  //   };
  //
  //   const keyUpHandler = (ev: KeyboardEvent) => {
  //     this._setLabelHeight(textarea);
  //     if (ev.key === KeyboardKey.ENTER && !ev.shiftKey) {
  //       focusOutHandler(ev);
  //     }
  //   };
  //
  //
  //   const textAreaChanged = () => {
  //     // console.log(component);
  //     if (textarea.value.trim().length === 0) {
  //       textarea.style.display = 'none';
  //       labelDots.style.display = 'block';
  //       removeIcon.style.display = 'none';
  //       this.adjustDotsPosition(jsPlumbConnection);
  //     } else {
  //       textarea.style.display = 'block';
  //       labelDots.style.display = 'none';
  //       removeIcon.style.display = 'block';
  //     }
  //   };
  //
  //   const clearLabel = () => {
  //     textarea.value = '';
  //     textAreaChanged();
  //     const connectionMeta: ConnectionMeta = _.first(this.findConnectionMeta(jsPlumbConnection.sourceId, jsPlumbConnection.targetId));
  //     this.saveAction();
  //   };
  //
  //
  //   const showTextAreaHideDots = () => {
  //     textarea.style.display = 'block';
  //     labelDots.style.display = 'none';
  //     removeIcon.style.display = 'block';
  //     textarea.focus();
  //   };
  //
  //   labelDots.addEventListener(EventListenerType.CLICK, showTextAreaHideDots);
  //
  //   textarea.addEventListener(EventListenerType.CHANGE, textAreaChanged);
  //   textarea.addEventListener(EventListenerType.FOCUS_OUT, focusOutHandler);
  //   textarea.addEventListener(EventListenerType.KEYUP, keyUpHandler);
  //   div.append(textarea);
  //
  //   removeIcon.setAttribute('class', 'overlay-remove-icon');
  //   removeIcon.addEventListener(EventListenerType.CLICK, clearLabel);
  //   div.append(removeIcon);
  //   div.append(labelDots);
  //   return div;
  // }
  //
}
