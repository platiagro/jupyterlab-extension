# -*- coding: utf-8 -*-
import os

import requests

DATASETS_ENDPOINT = os.getenv("DATASETS_ENDPOINT", "http://datasets.kubeflow:8080")
PROJECTS_ENDPOINT = os.getenv("PROJECTS_ENDPOINT", "http://projects.kubeflow:8080")


def update_component(component_id, experiment_notebook=None, deployment_notebook=None) -> dict:
    """Updates a component fro notebook using PlatIAgro Projects API.

    Args:
        component_id (str): the component uuid.
        experiment_notebook (dict): the experiment notebook.
        deployment_notebook (dict): the deployment notebook.

    Returns:
        dict: The component details.

    Raises:
        ConnectionError: When the request did not succeed.
        HTTPError: When the request did not succeed.
    """
    json = {}

    if experiment_notebook:
        json["experimentNotebook"] = experiment_notebook

    if deployment_notebook:
        json["deploymentNotebook"] = deployment_notebook

    r = requests.patch(f"{PROJECTS_ENDPOINT}/components/{component_id}", json=json)
    r.raise_for_status()
    return r.json()


def create_dataset(file: bytes, filename: str = "file") -> dict:
    """Creates a dataset from a CSV file using PlatIAgro Datasets API.

    Args:
        file (bytes): file object.
        filename (str, optional): filename. Defaults to "file".

    Returns:
        dict: The dataset details: name, columns, and filename.

    Raises:
        ConnectionError: When the request did not succeed.
        HTTPError: When the request did not succeed.
    """
    files = {"file": (filename, file)}
    r = requests.post(f"{DATASETS_ENDPOINT}/datasets", files=files)
    r.raise_for_status()
    return r.json()
