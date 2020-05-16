import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { requestAPI } from './jupyterlab-extension';

/**
 * Initialization data for the jupyterlab-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-extension',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension @platiagro/jupyterlab-extension is activated!');

    requestAPI<any>('get_example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The jupyterlab_extension server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default extension;
