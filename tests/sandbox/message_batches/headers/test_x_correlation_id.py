import requests
import pytest
from lib.constants.constants import CORRELATION_IDS, METHODS
from lib.constants.message_batches_paths import MESSAGE_BATCHES_ENDPOINT
from lib import Error_Handler


@pytest.mark.sandboxtest
@pytest.mark.parametrize("correlation_id", CORRELATION_IDS)
@pytest.mark.parametrize("method", METHODS)
def test_request_with_x_correlation_id(
    nhsd_apim_proxy_url,
    correlation_id,
    method
):
    """
    .. include:: ../../partials/headers/test_request_with_x_correlation_id.rst
    """
    resp = getattr(requests, method)(f"{nhsd_apim_proxy_url}{MESSAGE_BATCHES_ENDPOINT}", headers={
        "x-correlation-id": correlation_id
    })

    Error_Handler.handle_retry(resp)

    assert resp.headers.get("x-correlation-id") == correlation_id