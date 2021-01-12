# -*- coding: utf-8 -*-
import json
import re

from requests.exceptions import ConnectionError, HTTPError

from .services import update_task, parse_parameters


def post_save(model, os_path, contents_manager, **kwargs):
    """
    Updates parameters in PlatIAgro Projects API after save.

    Parameters
    ----------
    model: str
        File type. eg. notebook, directory
    os_path: str
        Path to file.
    contents_manager: notebook.services.contents.manager.ContentsManager
        Storage API for persisting notebooks and files.
    kwargs: **kwargs
        Arbitrary keyword arguments.
    """
    # only do this for notebooks
    if model["type"] != "notebook":
        return

    # only do this for Experiment.ipynb
    match = re.search(r"tasks/.*?/Experiment.ipynb", os_path)

    if match:
        task_id = None
        with open(os_path) as f:
            notebook = json.load(f)
            metadata = notebook.get("metadata", None)
            if metadata is not None:
                task_id = metadata.get("task_id", None)

        # only update notebook with task_id exist in metadata
        if task_id is None:
            return

        parameters = parse_parameters(notebook)

        try:
            update_task(task_id, parameters=parameters)
        except (ConnectionError, HTTPError) as e:
            print(str(e))


def setup_hooks(web_app):
    web_app.settings["contents_manager"].post_save_hook = post_save
