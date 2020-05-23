import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IMainMenu } from '@jupyterlab/mainmenu';

import { INotebookTracker } from '@jupyterlab/notebook';

import { ToolbarWidgetExtension } from './widget-extensions';

import { DatasetActions } from './dataset';

/**
 * The command IDs used by the extension.
 */
export namespace CommandIDs {
  export const setDataset = 'platiagro:setDataset';
  export const setParameter = 'platiagro:setParameter';
  export const openFiles = 'platiagro:openFiles';
}

/**
 * Initialization data for the jupyterlab-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-extension',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [IMainMenu],
  activate: (
    app: JupyterFrontEnd,
    nbtracker: INotebookTracker,
    mainMenu: IMainMenu | null
  ) => {
    console.log(
      'JupyterLab extension @platiagro/jupyterlab-extension is activated!'
    );

    addToolbarItems(app);

    addCommands(app, nbtracker);

    addMainMenuItems(mainMenu);

    addContextMenuItems(app);
  }
};

/**
 * Add a widget extension to the registry
 */
function addToolbarItems(app: JupyterFrontEnd): void {
  app.docRegistry.addWidgetExtension('Notebook', new ToolbarWidgetExtension());
}

/**
 * Add the commands for the jupyterlab-extension extension
 */
function addCommands(app: JupyterFrontEnd, nbtracker: INotebookTracker): void {
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
}

/**
 * Add new menu items to an existing menu
 */
function addMainMenuItems(mainMenu: IMainMenu | null): void {
  if (mainMenu) {
    mainMenu.editMenu.addGroup(
      [
        {
          command: CommandIDs.setDataset
        }
      ],
      20
    );
  }
}

/**
 * Add new context menu items to an existing menu
 */
function addContextMenuItems(app: JupyterFrontEnd): void {
  app.contextMenu.addItem({
    type: 'separator',
    selector: '.jp-Notebook',
    rank: 20
  });
  app.contextMenu.addItem({
    command: CommandIDs.setDataset,
    selector: '.jp-Notebook',
    rank: 21
  });
  app.contextMenu.addItem({
    type: 'separator',
    selector: '.jp-Notebook',
    rank: 23
  });
}

export default extension;
