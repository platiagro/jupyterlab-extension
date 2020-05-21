import { Widget } from '@lumino/widgets';

import { showDialog as showDialogBase, Dialog } from '@jupyterlab/apputils';

// import { AddWidget } from '@jupyterlab/celltags';

import { Notebook } from '@jupyterlab/notebook';

import { LabIcon } from '@jupyterlab/ui-components';

import setParameterSvgstr from '../style/icons/set-parameter.svg';

/**
 * A namespace for `ParameterActions` static methods.
 */
export namespace ParameterActions {
  /**
   * Show the dialog to set a parameter.
   *
   * @param notebook - The target notebook widget.
   * @param parameter - The initial parameter values to show in the dialog.
   */
  export const showDialog = async (
    notebook: Notebook,
    parameter: any = {
      name: '',
      variableType: '',
      fieldType: '',
      options: [],
      label: '',
      description: ''
    }
  ): Promise<void> => {
    // Open a dialog that hosts a form to set a parameter
    const result = await showDialogBase({
      title: 'Add or edit a parameter',
      body: new DialogBody(parameter),
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    });

    if (result.button.accept) {
      await setParameter(notebook, parameter);
    }
  };

  /**
   * Set a parameter in the parameters cell.
   *
   * @param notebook - The notebook widget.
   * @param parameter - The parameter.
   */
  export const setParameter = async (
    notebook: Notebook,
    parameter: any
  ): Promise<void> => {
    // validate required fields
    if (!parameter.name || !parameter.fieldType || !parameter.variableType) {
      await showDialogBase({
        title: 'Cannot add parameter',
        body: 'Variable name, Variable type, and Form field type are required',
        buttons: [Dialog.okButton()]
      });

      void ParameterActions.showDialog(notebook, parameter);
      return;
    }

    // get the index of first cell that has a tag 'parameters'
    const index = notebook.widgets.findIndex(cell => {
      const tags = cell.model.metadata.get('tags') as string[];
      return tags === null ? false : tags.includes('parameters');
    });

    // build the parameter source text
    const newsource = buildParameterText(parameter);

    if (index > -1) {
      // edit cell
      const cell = notebook.widgets[index].model;

      // either edit or insert parameter in the source code
      const regex = new RegExp(`^${parameter.name} = .*$`, 'm');

      if (cell.value.text.match(regex)) {
        cell.value.text = cell.value.text.replace(regex, newsource);
      } else {
        cell.value.text += `\n${newsource}`;
      }
    } else {
      // insert cell
      const newcell = notebook.model.contentFactory.createCodeCell({});
      newcell.value.text = newsource;
      newcell.metadata.set('tags', ['parameters']);
      notebook.model.cells.push(newcell);
    }
  };

  /**
   * Build parameter text in the format of Google Colaboratory Forms.
   *
   * @param parameter - The parameter.
   */
  const buildParameterText = (parameter: any): string => {
    let text = `${parameter.name} = `;

    // add initial values for each type
    if (
      parameter.variableType === 'string' ||
      parameter.variableType === 'feature'
    ) {
      text += parameter.value ? `"${parameter.value}"` : '""';
    } else if (
      parameter.variableType === 'integer' ||
      parameter.variableType === 'number'
    ) {
      text += parameter.value ? `${parameter.value}` : '0';
    } else if (parameter.variableType === 'boolean') {
      text += 'True';
    }

    text += ' #@param';

    if (parameter.options && parameter.options.length) {
      text += ` [${parameter.options}]`;
    }

    text += ` {type:"${parameter.variableType}"`;

    if (parameter.label) {
      text += `,label:"${parameter.label}"`;
    }

    if (parameter.description) {
      text += `,description:"${parameter.description}"`;
    }

    text += '}';
    return text;
  };
}

/**
 * A widget which hosts a form to set a parameter.
 */
class DialogBody extends Widget {
  private _parameter: any;
  private nameInput: HTMLInputElement;
  private variableTypeSelect: HTMLSelectElement;
  private fieldTypeSelect: HTMLSelectElement;
  private labelInput: HTMLInputElement;
  private descriptionTextArea: HTMLTextAreaElement;

  constructor(parameter: any) {
    super();
    this._parameter = parameter;
    this.buildForm(parameter);
  }

  buildForm(parameter: any): void {
    const body = document.createElement('div');
    body.className = 'modal-large';

    const left = document.createElement('div');
    left.className = 'left';
    const right = document.createElement('div');
    right.className = 'right';

    // Name Input
    const nameWrapper = document.createElement('div');
    nameWrapper.className = 'jp-input-wrapper';
    const nameTitle = document.createElement('label');
    nameTitle.textContent = 'Variable name:';
    this.nameInput = document.createElement('input');
    this.nameInput.name = 'name';
    this.nameInput.value = parameter.name;
    nameWrapper.appendChild(nameTitle);
    nameWrapper.appendChild(document.createElement('br'));
    nameWrapper.appendChild(this.nameInput);
    nameWrapper.appendChild(document.createElement('br'));
    left.appendChild(nameWrapper);

    // Label Input
    const labelWrapper = document.createElement('div');
    labelWrapper.className = 'jp-input-wrapper';
    const labelTitle = document.createElement('label');
    labelTitle.textContent = 'Label:';
    this.labelInput = document.createElement('input');
    this.labelInput.name = 'label';
    this.labelInput.value = parameter.label;
    labelWrapper.appendChild(labelTitle);
    labelWrapper.appendChild(document.createElement('br'));
    labelWrapper.appendChild(this.labelInput);
    labelWrapper.appendChild(document.createElement('br'));
    left.appendChild(labelWrapper);

    // Description TextArea
    const descriptionWrapper = document.createElement('div');
    descriptionWrapper.className = 'jp-input-wrapper';
    const descriptionTitle = document.createElement('label');
    descriptionTitle.textContent = 'Description:';
    this.descriptionTextArea = document.createElement('textarea');
    this.descriptionTextArea.name = 'description';
    this.descriptionTextArea.value = parameter.description;
    descriptionWrapper.appendChild(descriptionTitle);
    descriptionWrapper.appendChild(document.createElement('br'));
    descriptionWrapper.appendChild(this.descriptionTextArea);
    left.appendChild(descriptionWrapper);

    // Variable Type Select
    const variableTypeTitle = document.createElement('label');
    variableTypeTitle.textContent = 'Variable type:';
    this.variableTypeSelect = document.createElement('select');
    this.variableTypeSelect.name = 'variableType';
    const variableTypeOptions = [
      '',
      'string',
      'integer',
      'number',
      'boolean',
      'feature'
    ];
    variableTypeOptions.forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      option.selected = parameter.variableType === item;
      this.variableTypeSelect.appendChild(option);
    });
    right.appendChild(variableTypeTitle);
    right.appendChild(document.createElement('br'));
    right.appendChild(this.variableTypeSelect);

    // Field Type Select
    const fieldTypeTitle = document.createElement('label');
    fieldTypeTitle.textContent = 'Form field type:';
    this.fieldTypeSelect = document.createElement('select');
    this.fieldTypeSelect.name = 'fieldType';
    const fieldTypeOptions = ['', 'input', 'dropdown'];
    fieldTypeOptions.forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      option.selected = parameter.fieldType === item;
      this.fieldTypeSelect.appendChild(option);
    });
    right.appendChild(fieldTypeTitle);
    right.appendChild(document.createElement('br'));
    right.appendChild(this.fieldTypeSelect);

    //
    // const layout = new PanelLayout();
    // const option = new AddWidget();
    // option.id = 'add-tag';
    // layout.insertWidget(0, option);
    // for (const widget of layout.widgets) {
    //   right.appendChild(widget.node);
    // }

    body.appendChild(left);
    body.appendChild(right);
    this.node.appendChild(body);
  }

  onAfterAttach(): void {
    this.nameInput.addEventListener('keyup', this);
    this.variableTypeSelect.addEventListener('change', this);
    this.fieldTypeSelect.addEventListener('change', this);
    this.labelInput.addEventListener('keyup', this);
    this.descriptionTextArea.addEventListener('keyup', this);
  }

  onBeforeDetach(): void {
    this.nameInput.removeEventListener('keyup', this);
    this.variableTypeSelect.removeEventListener('change', this);
    this.fieldTypeSelect.removeEventListener('change', this);
    this.labelInput.removeEventListener('keyup', this);
    this.descriptionTextArea.removeEventListener('keyup', this);
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keyup':
        this._evtKeyUp(event as KeyboardEvent);
        break;
      case 'change':
        this._evtChange(event);
        break;
    }
  }

  private _evtKeyUp(event: KeyboardEvent): void {
    const target = event.target as HTMLInputElement;
    this._parameter[target.name] = target.value;
  }

  private _evtChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this._parameter[target.name] = target.value;
  }
}

export const setParameterIcon = new LabIcon({
  name: 'platiagro:set-parameter',
  svgstr: setParameterSvgstr
});
