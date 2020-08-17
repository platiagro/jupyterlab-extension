# -*- coding: utf-8 -*-
import json
import re

from requests.exceptions import ConnectionError, HTTPError

from .services import update_task


def post_save(model, os_path, contents_manager, **kwargs):
    """Send notebooks to PlatIAgro Projects API after save."""
    # only do this for notebooks
    if model["type"] != "notebook":
        return

    match = re.search(r"tasks/.*?/(Experiment|Deployment).ipynb", os_path)

    if match:
        notebook_type = match.group(1)

        task_id = None
        with open(os_path) as f:
            notebook = json.load(f)
            metadata = notebook.get('metadata', None)
            if metadata is not None:
                task_id = metadata.get('task_id', None)

        # only update notebook with task_id exist in metadata
        if task_id is None:
            return

        try:
            if notebook_type == "Experiment":
                update_task(task_id, experiment_notebook=notebook)
            else:
                update_task(task_id, deployment_notebook=notebook)
        except (ConnectionError, HTTPError) as e:
            print(str(e))


def setup_hooks(web_app):
    web_app.settings["contents_manager"].post_save_hook = post_save
