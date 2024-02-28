const KSUID = require("ksuid");
const {
  sendError,
  write_log,
  hasValidGlobalTemplatePersonalisation,
} = require("./utils");
const {
  validSendingGroupIds,
  invalidRoutingPlanId,
  sendingGroupIdWithMissingNHSTemplates,
  sendingGroupIdWithMissingTemplates,
  sendingGroupIdWithDuplicateTemplates,
  duplicateTemplates,
  trigger500SendingGroupId,
  trigger425SendingGroupId,
  globalNhsAppSendingGroupId,
} = require("./config");

async function batch_send(req, res, next) {
  if (req.headers["authorization"] === "banned") {
    sendError(
      res,
      403,
      "Request rejected because client service ban is in effect"
    );
    next();
    return;
  }

  if (!req.body) {
    sendError(res, 400, "Missing request body");
    next();
    return;
  }

  if (!req.body.data) {
    sendError(res, 400, "Missing request body data");
    next();
    return;
  }

  if (!req.body.data.type) {
    sendError(res, 400, "Missing request body data type");
    next();
    return;
  }

  if (req.body.data.type !== "MessageBatch") {
    sendError(res, 400, "Request body data type is not MessageBatch");
    next();
    return;
  }

  if (!req.body.data.attributes) {
    sendError(res, 400, "Missing request body data attributes");
    next();
    return;
  }

  const routingPlanId = req.body.data.attributes.routingPlanId;
  if (!routingPlanId) {
    sendError(res, 400, "Missing routingPlanId");
    next();
    return;
  }

  if (!req.body.data.attributes.messageBatchReference) {
    sendError(res, 400, "Missing messageBatchReference");
    next();
    return;
  }

  const messages = req.body.data.attributes.messages;
  if (!Array.isArray(messages)) {
    sendError(res, 400, "Missing messages array");
    next();
    return;
  }

  const messageReferences = messages.map((message) => message.messageReference);
  if (messageReferences.includes(undefined)) {
    sendError(res, 400, "Missing messageReferences");
    next();
    return;
  }

  if (new Set(messageReferences).size !== messageReferences.length) {
    sendError(res, 400, "Duplicate messageReferences");
    next();
    return;
  }

  if (!validSendingGroupIds[routingPlanId]) {
    sendError(
      res,
      404,
      `Routing Config does not exist for clientId "sandbox_client_id" and routingPlanId "${req.body.data.attributes.routingPlanId}"`
    );
    next();
    return;
  }

  if (routingPlanId === invalidRoutingPlanId) {
    sendError(res, 400, "Invalid Routing Config");
    next();
    return;
  }

  if (routingPlanId === trigger425SendingGroupId) {
    sendError(
      res,
      425,
      "Message with this idempotency key is already being processed"
    );
    next();
    return;
  }

  if (
    routingPlanId === globalNhsAppSendingGroupId &&
    messages.findIndex(
      (message) =>
        !hasValidGlobalTemplatePersonalisation(message.personalisation)
    ) > -1
  ) {
    sendError(res, 400, "Expect single personalisation field of 'body'");
    next();
    return;
  }

  if (routingPlanId === sendingGroupIdWithMissingNHSTemplates) {
    sendError(
      res,
      500,
      `NHS App Template does not exist with internalTemplateId: invalid-template`
    );
    next();
    return;
  }

  if (routingPlanId === sendingGroupIdWithMissingTemplates) {
    sendError(
      res,
      500,
      `Templates required in "${req.body.data.attributes.routingPlanId}" routing config not found`
    );
    next();
    return;
  }

  if (routingPlanId === sendingGroupIdWithDuplicateTemplates) {
    sendError(
      res,
      500,
      `Duplicate templates in routing config: ${JSON.stringify(
        duplicateTemplates
      )}`
    );
    next();
    return;
  }

  if (routingPlanId === trigger500SendingGroupId) {
    sendError(res, 500, "Error writing request items to DynamoDB");
    next();
    return;
  }

  write_log(res, "warn", {
    message: "/api/v1/send",
    req: {
      path: req.path,
      query: req.query,
      headers: req.rawHeaders,
      payload: req.body,
    },
  });

  res.json({
    requestId: KSUID.randomSync(new Date()).string,
    routingPlan: {
      id: routingPlanId,
      version: "1",
    },
  });
  res.end();
  next();
}

module.exports = {
  batch_send,
};
