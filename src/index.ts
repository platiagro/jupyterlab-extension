import {
  IRouter,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IMainMenu } from '@jupyterlab/mainmenu';

import { INotebookTracker } from '@jupyterlab/notebook';

import { ToolbarWidgetExtension } from './widget-extensions';

import { DatasetActions } from './dataset';

import { ParameterActions } from './parameter';

import { UrlActions } from './url';

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
  requires: [JupyterFrontEnd.IPaths, INotebookTracker, IRouter],
  optional: [IMainMenu],
  activate: (
    app: JupyterFrontEnd,
    paths: JupyterFrontEnd.IPaths,
    nbtracker: INotebookTracker,
    router: IRouter,
    mainMenu: IMainMenu | null
  ) => {
    console.log(
      'JupyterLab extension @platiagro/jupyterlab-extension is activated!'
    );

    addToolbarItems(app);

    addCommands(app, paths, nbtracker, router);

    addMainMenuItems(mainMenu);

    addContextMenuItems(app);

    addRouteHandlers(router);
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
function addCommands(
  app: JupyterFrontEnd,
  paths: JupyterFrontEnd.IPaths,
  nbtracker: INotebookTracker,
  router: IRouter
): void {
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
    label: 'Upload File and Set Dataset Name',
    execute: () => {
      DatasetActions.showDialog(nbtracker.currentWidget.content);
    },
    isEnabled
  });

  app.commands.addCommand(CommandIDs.setParameter, {
    label: 'Add Parameter',
    execute: () => {
      ParameterActions.showDialog(nbtracker.currentWidget.content);
    },
    isEnabled
  });

  app.commands.addCommand(CommandIDs.openFiles, {
    label: 'Open Files…',
    execute: () => {
      UrlActions.openFiles(app, paths, router);
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
        },
        {
          command: CommandIDs.setParameter
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
    command: CommandIDs.setParameter,
    selector: '.jp-Notebook',
    rank: 22
  });
  app.contextMenu.addItem({
    type: 'separator',
    selector: '.jp-Notebook',
    rank: 23
  });
}

/**
 * Add new URL Functions
 */
function addRouteHandlers(router: IRouter): void {
  router.register({
    command: CommandIDs.openFiles,
    pattern: /(\?open=.*?|&open=.*?)($|&)/,
    rank: 10 // High priority: 10:100.
  });
}

export default extension;
