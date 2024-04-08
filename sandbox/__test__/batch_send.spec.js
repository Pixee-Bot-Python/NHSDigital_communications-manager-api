import request from "supertest"
import { assert } from "chai";
import { setup } from './helpers.js'


describe("/api/v1/send", () => {
  let env;
  let server;

  before(function () {
    env = process.env;
    server = setup();
  });

  after(function () {
    process.env = env;
    server.close();
  });

  it("returns a service ban (403) when the user is banned", (done) => {
    request(server)
      .post("/api/v1/send")
      .set({ Authorization: "banned" })
      .expect(403, {
        message: "Request rejected because client service ban is in effect",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 400 when body doesnt exist", (done) => {
    request(server)
      .post("/api/v1/send")
      .expect(400, {
        message: "Missing request body",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 400 when body data doesnt exist", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({})
      .expect(400, {
        message: "Missing request body data",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 400 when type is missing", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({ data: {} })
      .expect(400, {
        message: "Missing request body data type",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 400 when type isnt MessageBatch", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({ data: { type: "Message" } })
      .expect(400, {
        message: "Request body data type is not MessageBatch",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 400 when attributes dont exist", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({ data: { type: "MessageBatch" } })
      .expect(400, {
        message: "Missing request body data attributes",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 400 when the routingPlanId doesnt exist", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({ data: { type: "MessageBatch", attributes: {} } })
      .expect(400, {
        message: "Missing routingPlanId",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 400 when the routingPlanId is null", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: null,
          },
        },
      })
      .expect(400, {
        message: "Missing routingPlanId",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 400 when the messageBatchReference doesnt exist", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "sending-group-id",
          },
        },
      })
      .expect(400, {
        message: "Missing messageBatchReference",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 400 when the messageBatchReference is null", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "sending-group-id",
            messageBatchReference: null,
          },
        },
      })
      .expect(400, {
        message: "Missing messageBatchReference",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 400 when messages doesnt exist", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "sending-group-id",
            messageBatchReference: "request-ref-id",
          },
        },
      })
      .expect(400, {
        message: "Missing messages array",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 400 when messages is null", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "sending-group-id",
            messageBatchReference: "request-ref-id",
            messages: null,
          },
        },
      })
      .expect(400, {
        message: "Missing messages array",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 400 when messages is not an array", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "sending-group-id",
            messageBatchReference: "request-ref-id",
            messages: "invalid",
          },
        },
      })
      .expect(400, {
        message: "Missing messages array",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 400 when the data does not contain items with messageReference", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "sending-group-id",
            messageBatchReference: "request-ref-id",
            messages: [
              {
                notAMessageReference: "1",
              },
            ],
          },
        },
      })
      .expect(400, {
        message: "Missing messageReferences",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 400 when the data contains duplicate messageReferences", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "sending-group-id",
            messageBatchReference: "request-ref-id",
            messages: [
              {
                messageReference: "1",
              },
              {
                messageReference: "1",
              },
            ],
          },
        },
      })
      .expect(400, {
        message: "Duplicate messageReferences",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 404 when routingPlanId is not found", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "sending-group-id",
            messageBatchReference: "request-ref-id",
            messages: [
              {
                messageReference: "1",
              },
              {
                messageReference: "2",
              },
            ],
          },
        },
      })
      .expect(404, {
        message:
          'Routing Config does not exist for clientId "sandbox_client_id" and routingPlanId "sending-group-id"',
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 400 when routing plan is invalid", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "4ead415a-c033-4b39-9b05-326ac237a3be",
            messageBatchReference: "request-ref-id",
            messages: [
              {
                messageReference: "1",
              },
              {
                messageReference: "2",
              },
            ],
          },
        },
      })
      .expect(400, {
        message: "Invalid Routing Config",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 425 when a repeat request is sent too early", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "d895ade5-0029-4fc3-9fb5-86e1e5370854",
            messageBatchReference: "request-ref-id",
            messages: [
              {
                messageReference: "1",
              },
              {
                messageReference: "2",
              },
            ],
          },
        },
      })
      .expect(425, {
        message: "Message with this idempotency key is already being processed",
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 500 when the sending group has missing templates", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "c8857ccf-06ec-483f-9b3a-7fc732d9ad48",
            messageBatchReference: "request-ref-id",
            messages: [
              {
                messageReference: "1",
              },
              {
                messageReference: "2",
              },
            ],
          },
        },
      })
      .expect(500, {
        message:
          'Templates required in "c8857ccf-06ec-483f-9b3a-7fc732d9ad48" routing config not found',
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 500 when the sending group has duplicate templates", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "a3a4e55d-7a21-45a6-9286-8eb595c872a8",
            messageBatchReference: "request-ref-id",
            messages: [
              {
                messageReference: "1",
              },
              {
                messageReference: "2",
              },
            ],
          },
        },
      })
      .expect(500, {
        message:
          'Duplicate templates in routing config: [{"name":"EMAIL_TEMPLATE","type":"EMAIL"},{"name":"SMS_TEMPLATE","type":"SMS"},{"name":"LETTER_TEMPLATE","type":"LETTER"},{"name":"LETTER_PDF_TEMPLATE","type":"LETTER_PDF"},{"name":"NHSAPP_TEMPLATE","type":"NHSAPP"}]',
      })
      .expect("Content-Type", /json/, done);
  });

  it("returns a 500 when the sending group has missing NHS templates", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "aeb16ab8-cb9c-4d23-92e9-87c78119175c",
            messageBatchReference: "request-ref-id",
            messages: [
              {
                messageReference: "1",
              },
              {
                messageReference: "2",
              },
            ],
          },
        },
      })
      .expect(500, {
        message:
          "NHS App Template does not exist with internalTemplateId: invalid-template",
      })
      .expect("Content-Type", /json/, done);
  });

  it("can simulate a 500 error", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "3bb82e6a-9873-4683-b2b9-fdf33c9ba86f",
            messageBatchReference: "simulate-500",
            messages: [
              {
                messageReference: "1",
              },
              {
                messageReference: "2",
              },
            ],
          },
        },
      })
      .expect(500, {
        message: "Error writing request items to DynamoDB",
      })
      .expect("Content-Type", /json/, done);
  });

  it("responds with a 200 when the request is correctly formatted", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "b838b13c-f98c-4def-93f0-515d4e4f4ee1",
            messageBatchReference: "request-id",
            messages: [
              {
                messageReference: "1",
              },
              {
                messageReference: "2",
              },
            ],
          },
        },
      })
      .expect(200)
      .expect((res) => {
        assert.notEqual(res.body.requestId, undefined);
        assert.notEqual(res.body.requestId, null);
        assert.notEqual(res.body.routingPlan.id, undefined);
        assert.notEqual(res.body.routingPlan.id, null);
        assert.notEqual(res.body.routingPlan.version, undefined);
        assert.notEqual(res.body.routingPlan.version, null);
      })
      .expect("Content-Type", /json/, done);
  });

  it("responds with a 200 for a valid global NHS app routing plan", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "00000000-0000-0000-0000-000000000001",
            messageBatchReference: "request-id",
            messages: [
              {
                messageReference: "1",
                recipient: {
                  nhsNumber: "1",
                  dateOfBirth: "1",
                },
                personalisation: {
                  body: "Free text message 1",
                },
              },
              {
                messageReference: "2",
                recipient: {
                  nhsNumber: "2",
                  dateOfBirth: "2",
                },
                personalisation: {
                  body: "Free text message 2",
                },
              },
            ],
          },
        },
      })
      .expect(200)
      .expect((res) => {
        assert.notEqual(res.body.requestId, undefined);
        assert.notEqual(res.body.requestId, null);
        assert.notEqual(res.body.routingPlan.id, undefined);
        assert.notEqual(res.body.routingPlan.id, null);
        assert.notEqual(res.body.routingPlan.version, undefined);
        assert.notEqual(res.body.routingPlan.version, null);
      })
      .expect("Content-Type", /json/, done);
  });

  it("responds with a 400 for missing personalisation for global NHS app routing plan", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "00000000-0000-0000-0000-000000000001",
            messageBatchReference: "request-id",
            messages: [
              {
                messageReference: "1",
                recipient: {
                  nhsNumber: "1",
                  dateOfBirth: "1",
                },
              },
              {
                messageReference: "2",
                recipient: {
                  nhsNumber: "2",
                  dateOfBirth: "2",
                },
                personalisation: {
                  body: "Free text message 2",
                },
              },
            ],
          },
        },
      })
      .expect(400, {
        message: "Expect single personalisation field of 'body'",
      })
      .expect("Content-Type", /json/, done);
  });

  it("responds with a 400 for missing body for global NHS app routing plan", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "00000000-0000-0000-0000-000000000001",
            messageBatchReference: "request-id",
            messages: [
              {
                messageReference: "1",
                recipient: {
                  nhsNumber: "1",
                  dateOfBirth: "1",
                },
                personalisation: {
                  body: "Free text message 1",
                },
              },
              {
                messageReference: "2",
                recipient: {
                  nhsNumber: "2",
                  dateOfBirth: "2",
                },
                personalisation: {
                  unknownField: "Free text message 2",
                },
              },
            ],
          },
        },
      })
      .expect(400, {
        message: "Expect single personalisation field of 'body'",
      })
      .expect("Content-Type", /json/, done);
  });

  it("responds with a 400 for redundant personalisation for global NHS app routing plan", (done) => {
    request(server)
      .post("/api/v1/send")
      .send({
        data: {
          type: "MessageBatch",
          attributes: {
            routingPlanId: "00000000-0000-0000-0000-000000000001",
            messageBatchReference: "request-id",
            messages: [
              {
                messageReference: "1",
                recipient: {
                  nhsNumber: "1",
                  dateOfBirth: "1",
                },
                personalisation: {
                  body: "Free text message 1",
                },
              },
              {
                messageReference: "2",
                recipient: {
                  nhsNumber: "2",
                  dateOfBirth: "2",
                },
                personalisation: {
                  body: "Free text message 2",
                  unknownField: "Unknown field",
                },
              },
            ],
          },
        },
      })
      .expect(400, {
        message: "Expect single personalisation field of 'body'",
      })
      .expect("Content-Type", /json/, done);
  });
});
