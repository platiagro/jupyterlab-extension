import { Widget } from '@lumino/widgets';

import {
  showDialog as showDialogBase,
  Dialog,
  showErrorMessage
} from '@jupyterlab/apputils';

import { Notebook } from '@jupyterlab/notebook';

import { LabIcon } from '@jupyterlab/ui-components';

import { ParameterActions } from './parameter';

import { requestAPI } from './server-api';

import setDatasetSvgstr from '../style/icons/set-dataset.svg';

/**
 * A namespace for `DatasetActions` static methods.
 */
export namespace DatasetActions {
  /**
   * Show the dialog to set a dataset.
   *
   * @param notebook - The target notebook widget.
   */
  export const showDialog = async (notebook: Notebook): Promise<void> => {
    // declare an object that will keep the inputted data
    const parameter: any = {
      file: null
    };

    // Open a dialog that hosts a form to select a file
    const result = await showDialogBase({
      title: 'Upload File and Set Dataset Name',
      body: new DialogBody(parameter),
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    });

    if (result.button.accept) {
      // Call backend to create a dataset using the selected file
      const response = await createDataset(parameter.file);
      if (response) {
        const parameter = {
          name: 'dataset',
          value: response.name === null ? '' : response.name,
          variableType: 'string',
          fieldType: 'input'
        };
        ParameterActions.setParameter(notebook, parameter);
      }
    }
  };

  /**
   * Call backend to create a dataset using the selected file
   */
  const createDataset = async (file: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await requestAPI<any>('datasets', {
        method: 'POST',
        body: formData
      });
      return response;
    } catch (error) {
      console.error(
        'The jupyterlab_extension server extension appears to be missing.\n'
      );
      void showErrorMessage('Upload Error', error);
    }
  };
}

/**
 * A widget which hosts a form to upload a CSV file.
 */
class DialogBody extends Widget {
  private _parameter: any;
  private input: HTMLInputElement;

  constructor(parameter: any) {
    super();
    this._parameter = parameter;
    this.buildForm();
  }

  buildForm(): void {
    const body = document.createElement('div');

    // Input File
    const title = document.createElement('label');
    title.textContent = 'Select a file:';
    this.input = document.createElement('input');
    this.input.type = 'file';
    this.input.accept = '.csv';
    this.input.multiple = false;
    this.input.onclick = this.onInputClicked;
    this.input.onchange = this.onInputChanged;
    body.appendChild(title);
    body.appendChild(this.input);

    this.node.appendChild(body);
  }

  /**
   * The 'change' handler for the input field.
   */
  private onInputChanged = (): void => {
    const files = Array.prototype.slice.call(this.input.files) as File[];
    this._parameter['file'] = files[0];
  };

  /**
   * The 'click' handler for the input field.
   */
  private onInputClicked = (): void => {
    // In order to allow repeated uploads of the same file (with delete in between),
    // we need to clear the input value to trigger a change event.
    this.input.value = '';
  };
}

export const setDatasetIcon = new LabIcon({
  name: 'platiagro:set-dataset',
  svgstr: setDatasetSvgstr
});
