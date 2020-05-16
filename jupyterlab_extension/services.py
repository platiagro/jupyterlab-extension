# -*- coding: utf-8 -*-
import os
from typing import IO

import requests

PROJECTS_ENDPOINT = os.getenv("PROJECTS_ENDPOINT", "http://projects.kubeflow:8080")


def update_component(component_id, training_notebook=None, inference_notebook=None) -> dict:
    """Uploads a file to PlatIAgro Datasets API.

    Args:
        component_id (str): the component uuid.
        training_notebook (str): the training notebook.
        inference_notebook (str): the inference notebook.

    Returns:
        dict: The component details.
    """
    json = {}

    if training_notebook:
        json["trainingNotebook"] = training_notebook

    if inference_notebook:
        json["inferenceNotebook"] = inference_notebook

    r = requests.patch(f"{PROJECTS_ENDPOINT}/components/{component_id}", json=json)
    r.raise_for_status()
