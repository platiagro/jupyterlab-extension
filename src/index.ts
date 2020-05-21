import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IMainMenu } from '@jupyterlab/mainmenu';

import { INotebookTracker } from '@jupyterlab/notebook';

import { ToolbarWidgetExtension } from './widget-extensions';

import { DatasetActions } from './dataset';

import { ParameterActions } from './parameter';

/**
 * The command IDs used by the extension.
 */
export namespace CommandIDs {
  export const setDataset = 'platiagro:setDataset';
  export const setParameter = 'platiagro:setParameter';
}

/**
 * Initialization data for the jupyterlab-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-extension',
  autoStart: true,
  requires: [IMainMenu, INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    mainMenu: IMainMenu,
    nbtracker: INotebookTracker
  ) => {
    console.log('JupyterLab extension @platiagro/jupyterlab-extension is activated!');

    addToolbarItems(app)

    addCommands(app, nbtracker);

    addMenuItems(mainMenu);
  }
};

/**
 * Add a widget extension to the registry
 */
function addToolbarItems(app: JupyterFrontEnd) {
    app.docRegistry.addWidgetExtension('Notebook', new ToolbarWidgetExtension());
}

/**
 * Add the commands for the jupyterlab-extension extension
 */
function addCommands(app: JupyterFrontEnd, nbtracker: INotebookTracker) {

  /**
   * Whether there is an active notebook.
   */
  function isEnabled(): boolean {
    return (
      nbtracker.currentWidget !== null &&
      nbtracker.currentWidget === app.shell.currentWidget
    );
  }

  app.commands.addCommand(CommandIDs.setDataset, {
    label: 'Upload a CSV file and set the dataset name',
    execute: () => {
      DatasetActions.showDialog(nbtracker.currentWidget.content);
    },
    isEnabled
  });

  app.commands.addCommand(CommandIDs.setParameter, {
    label: 'Add or edit a parameter',
    execute: () => {
      ParameterActions.showDialog(nbtracker.currentWidget.content);
    },
    isEnabled
  });
}

/**
 * Add new menu items to an existing menu
 */
function addMenuItems(mainMenu: IMainMenu) {
  mainMenu.editMenu.addGroup([
    {
      command: CommandIDs.setDataset,
    },
    {
      command: CommandIDs.setParameter,
    }
  ], 20);
}

export default extension;
