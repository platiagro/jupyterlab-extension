# -*- coding: utf-8 -*-
import os

import requests

DATASETS_ENDPOINT = os.getenv("DATASETS_ENDPOINT", "http://datasets.kubeflow:8080")
PROJECTS_ENDPOINT = os.getenv("PROJECTS_ENDPOINT", "http://projects.kubeflow:8080")


def update_component(component_id, training_notebook=None, inference_notebook=None) -> dict:
    """Updates a component fro notebook using PlatIAgro Projects API.

    Args:
        component_id (str): the component uuid.
        training_notebook (dict): the training notebook.
        inference_notebook (dict): the inference notebook.

    Returns:
        dict: The component details.

    Raises:
        HTTPError: When the request did not succeed.
    """
    json = {}

    if training_notebook:
        json["trainingNotebook"] = training_notebook

    if inference_notebook:
        json["inferenceNotebook"] = inference_notebook

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
        HTTPError: When the request did not succeed.
    """
    files = {"file": (filename, file)}
    r = requests.post(f"{DATASETS_ENDPOINT}/datasets", files=files)
    r.raise_for_status()
    return r.json()
