import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ToolbarWidgetExtension } from './widget-extensions';

/**
 * Initialization data for the jupyterlab-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-extension',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension @platiagro/jupyterlab-extension is activated!');

    // Add a widget extension to the registry
    app.docRegistry.addWidgetExtension('Notebook', new ToolbarWidgetExtension());
  }
};

export default extension;
