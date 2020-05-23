import { showDialog as showDialogBase, Dialog } from '@jupyterlab/apputils';

import { Notebook } from '@jupyterlab/notebook';

/**
 * A namespace for `ParameterActions` static methods.
 */
export namespace ParameterActions {
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
