import { Widget } from '@lumino/widgets';

import { closeIcon } from '@jupyterlab/ui-components';

import { DropdownOptions } from './dropdown-options';

/**
 * A widget which hosts a dropdown option area.
 */
export class OptionWidget extends Widget {
  /**
   * Construct a new tag widget.
   */
  constructor(name: string) {
    super();
    this.applied = true;
    this.name = name;
    this.addClass('tag');
    this.buildOption();
  }

  /**
   * Create tag div with icon and attach to this.node.
   */
  buildOption(): void {
    const text = document.createElement('span');
    text.textContent = this.name;
    text.style.textOverflow = 'ellipsis';
    const option = document.createElement('div');
    option.className = 'tag-holder';
    option.appendChild(text);
    const iconContainer = closeIcon.element({
      tag: 'span',
      elementPosition: 'center',
      height: '18px',
      width: '18px',
      marginLeft: '5px',
      marginRight: '-3px',
    });
    if (this.applied) {
      this.addClass('applied-tag');
    } else {
      this.addClass('unapplied-tag');
      iconContainer.style.display = 'none';
    }
    option.appendChild(iconContainer);
    this.node.appendChild(option);

    this.node.addEventListener('mousedown', this);
    this.node.addEventListener('mouseover', this);
    this.node.addEventListener('mouseout', this);
  }

  /**
   * Handle the DOM events for the widget.
   *
   * @param event - The DOM event sent to the widget.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the dock panel's node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'mousedown':
        this._evtClick();
        break;
      case 'mouseover':
        this._evtMouseOver();
        break;
      case 'mouseout':
        this._evtMouseOut();
        break;
      default:
        break;
    }
  }

  /**
   * Update styling to reflect whether option is applied to current active cell.
   */
  toggleApplied(): void {
    if (this.applied) {
      this.removeClass('applied-tag');
      (this.node.firstChild.lastChild as HTMLSpanElement).style.display =
        'none';
      this.addClass('unapplied-tag');
    } else {
      this.removeClass('unapplied-tag');
      (this.node.firstChild.lastChild as HTMLSpanElement).style.display =
        'inline-block';
      this.addClass('applied-tag');
    }
    this.applied = !this.applied;
  }

  /**
   * Handle the `'click'` event for the widget.
   */
  private _evtClick(): void {
    if (this.applied) {
      this.parent.removeOption(this.name);
    } else {
      this.parent.addOption(this.name);
    }
    this.toggleApplied();
  }

  /**
   * Handle the `'mouseover'` event for the widget.
   */
  private _evtMouseOver(): void {
    (this.node as HTMLElement).classList.add('tag-hover');
  }

  /**
   * Handle the `'mouseout'` event for the widget.
   */
  private _evtMouseOut(): void {
    (this.node as HTMLElement).classList.remove('tag-hover');
  }

  public name: string;
  private applied: boolean;
  public parent: DropdownOptions;
}
