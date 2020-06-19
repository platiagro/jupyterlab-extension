import { IRouter, JupyterFrontEnd } from '@jupyterlab/application';

import { URLExt } from '@jupyterlab/coreutils';

/**
 * A namespace for `UrlActions` static methods.
 */
export namespace UrlActions {
  /**
   * Open files specified by the query string ?open=filename1,filename2
   *
   * @param app - The JupyterLab application object.
   * @param paths - The JupyterLab application paths dictionary.
   * @param router - The URL router used by the application.
   */
  export const openFiles = async (
    app: JupyterFrontEnd,
    paths: JupyterFrontEnd.IPaths,
    router: IRouter
  ): Promise<void> => {
    const args = router.current;

    // get the filenames to open
    const query = URLExt.queryStringToObject(args.search || '');

    // if a reset was sent, wait for reset to complete
    if ('reset' in query) {
      return;
    }

    const filenames = query['open'].split(',');
    // get url path, then removes prefixes: `/lab/workspaces/foo`, `/lab`, `/tree`
    const dirpath = args.path
      .replace(new RegExp(`^${paths.urls.workspaces}/([^?/]+)`), '')
      .replace(new RegExp(`^${paths.urls.app}`), '')
      .replace(new RegExp('^/tree'), '');

    const sleep = (milliseconds: number): Promise<void> => {
      return new Promise(resolve => setTimeout(resolve, milliseconds));
    };

    // open files
    for (const filename of filenames) {
      // necessary sleep to guarantee the order of opening of the notebooks
      // because the command docmanager:open is asynchronous
      await sleep(500);
      void app.commands.execute('docmanager:open', {
        path: `${dirpath.substr(1)}/${filename}`
      });
    }

    // clean query string
    delete query['open'];
    const url = args.path + URLExt.objectToQueryString(query) + args.hash;
    router.navigate(url);
  };
}
