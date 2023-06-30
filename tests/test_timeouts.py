"""
Server responds with a 408 when unable to recieve request in a specified time period
"""

import requests
import pytest

REQUEST_PATH = ""


def __assert_408_error(resp, check_body=True):
    assert resp.status_code == 408

    if check_body:
        error = resp.json().get("errors")[0]
        assert error.get("id") == "CM_TIMEOUT"
        assert error.get("status") == "408"
        assert error.get("title") == "Request timeout"
        assert (
            error.get("description") == "The service was unable to receive your request within the timeout period."
        )


def __assert_504_error(resp, check_body=True):
    assert resp.status_code == 504

    if check_body:
        error = resp.json().get("errors")[0]
        assert error.get("id") == "CM_TIMEOUT"
        assert error.get("status") == "504"
        assert error.get("title") == "Unable to call service"
        assert (
            error.get("description") == "The downstream service has not responded within the configured timeout period."
        )


@pytest.mark.sandboxtest
def test_408_timeout_get(nhsd_apim_proxy_url):
    resp = requests.get(f"{nhsd_apim_proxy_url}/_timeout_408")
    __assert_408_error(resp)


@pytest.mark.sandboxtest
def test_504_timeout_get(nhsd_apim_proxy_url):
    resp = requests.get(f"{nhsd_apim_proxy_url}/_timeout_504")
    __assert_504_error(resp)


@pytest.mark.sandboxtest
def test_504_timeout_simulate(nhsd_apim_proxy_url):
    resp = requests.get(f"{nhsd_apim_proxy_url}/_timeout?sleep=3000")
    __assert_504_error(resp)