import {
  IRouter,
  JupyterFrontEnd
} from '@jupyterlab/application';

import { URLExt } from '@jupyterlab/coreutils';

/**
 * A namespace for `UrlActions` static methods.
 */
export namespace UrlActions {
  export async function openNotebooks(
    app: JupyterFrontEnd,
    paths: JupyterFrontEnd.IPaths,
    router: IRouter
  ) {
    const args = router.current;
    // gets url path, then removes prefixes: `/lab/workspaces/foo`, `/lab`, `/tree`
    const dirpath = args.path
      .replace(new RegExp(`^${paths.urls.workspaces}\/([^?\/]+)`), '')
      .replace(new RegExp(`^${paths.urls.app}`), '')
      .replace(new RegExp('^/tree'), '');

    // fetch the contents of dirpath
    const item = await app.serviceManager.contents.get(dirpath);

    if (item.type === 'directory') {
      // gets the filenames to open
      const query = URLExt.queryStringToObject(args.search || '');
      const filenames = query['open'].split(',');

      // close open tabs
      void app.commands.execute('application:close-all');

      // open filenames
      filenames.forEach((filename: string) => {
        void app.commands.execute('docmanager:open', { path: `${dirpath}/${filename}` });
      });

      // remove query string from url
      delete query['open'];
      const url = args.path + URLExt.objectToQueryString(query) + args.hash;
      router.navigate(url);
    }
  }
}
