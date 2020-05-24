import { Widget } from '@lumino/widgets';

import { addIcon } from '@jupyterlab/ui-components';

import { DropdownOptions } from './dropdown-options';

/**
 * A widget which hosts a dropdown option area.
 */
export class AddWidget extends Widget {
  /**
   * Construct a new widget.
   */
  constructor() {
    super();
    this.addClass('tag');
    this.editing = false;
    this.buildOption();
  }

  /**
   * Create input box with icon and attach to this.node.
   */
  buildOption(): void {
    const text = document.createElement('input');
    text.value = 'Add Option';
    text.contentEditable = 'true';
    text.className = 'add-tag';
    text.style.width = '64px';
    this.input = text;
    this.input.maxLength = 20;
    const option = document.createElement('div');
    option.className = 'tag-holder';
    option.appendChild(text);
    const iconContainer = addIcon.element({
      tag: 'span',
      elementPosition: 'center',
      height: '18px',
      width: '18px',
      marginLeft: '3px',
      marginRight: '-5px'
    });
    this.addClass('unapplied-tag');
    option.appendChild(iconContainer);
    this.node.appendChild(option);

    this.node.addEventListener('mousedown', this);
    this.input.addEventListener('keydown', this);
    this.input.addEventListener('focus', this);
    this.input.addEventListener('blur', this);
  }

  /**
   * Handle the DOM events for the widget.
   *
   * @param event - The DOM event sent to the widget.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'mousedown':
        this._evtMouseDown(event as MouseEvent);
        break;
      case 'keydown':
        this._evtKeyDown(event as KeyboardEvent);
        break;
      case 'blur':
        this._evtBlur();
        break;
      case 'focus':
        this._evtFocus();
        break;
      default:
        break;
    }
  }

  /**
   * Handle the `'mousedown'` event for the input box.
   *
   * @param event - The DOM event sent to the widget
   */
  private _evtMouseDown(event: MouseEvent): void {
    if (!this.editing) {
      this.editing = true;
      this.input.value = '';
      this.input.focus();
    } else if (event.target !== this.input) {
      if (this.input.value !== '') {
        const value = this.input.value;
        this.parent.addOption(value);
        this.input.blur();
        this._evtBlur();
      }
    }
    event.preventDefault();
  }

  /**
   * Handle the `'focus'` event for the input box.
   */
  private _evtFocus(): void {
    if (!this.editing) {
      this.input.blur();
    }
  }

  /**
   * Handle the `'keydown'` event for the input box.
   *
   * @param event - The DOM event sent to the widget
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    const tmp = document.createElement('span');
    tmp.className = 'add-tag';
    tmp.innerHTML = this.input.value;
    // set width to the pixel length of the text
    document.body.appendChild(tmp);
    this.input.style.width = tmp.getBoundingClientRect().width + 8 + 'px';
    document.body.removeChild(tmp);
    // if they hit Enter, add the option and reset state
    if (event.keyCode === 13) {
      const value = this.input.value;
      this.parent.addOption(value);
      this.input.blur();
      this._evtBlur();
    }
  }

  /**
   * Handle the `'focusout'` event for the input box.
   */
  private _evtBlur(): void {
    if (this.editing) {
      this.editing = false;
      this.input.value = 'Add Option';
      this.input.style.width = '64px';
    }
  }

  public parent: DropdownOptions;
  private editing: boolean;
  private input: HTMLInputElement;
}
