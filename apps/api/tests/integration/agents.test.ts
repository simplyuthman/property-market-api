import test from "node:test";
import assert from "node:assert/strict";
import { parseAgentListParams, validateIdParam } from "../../lib/validation";
import { successListResponse, successSingleResponse, errorResponse } from "../../lib/envelope";

test("GET /api/v1/agents validation and envelope tests", async (t) => {
  await t.test("clamps limit above 100 to 100 silently", () => {
    const params = new URLSearchParams("limit=150");
    const result = parseAgentListParams(params);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.limit, 100);
    }
  });

  await t.test("defaults limit to 20 when omitted", () => {
    const params = new URLSearchParams("");
    const result = parseAgentListParams(params);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.limit, 20);
      assert.equal(result.data.offset, 0);
    }
  });

  await t.test("rejects negative offset with INVALID_OFFSET", () => {
    const params = new URLSearchParams("offset=-5");
    const result = parseAgentListParams(params);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.code, "INVALID_OFFSET");
    }
  });

  await t.test("rejects invalid sort field with INVALID_SORT_FIELD", () => {
    const params = new URLSearchParams("sort=invalid_field");
    const result = parseAgentListParams(params);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.code, "INVALID_SORT_FIELD");
      assert.match(result.error.message, /name, createdAt/);
    }
  });

  await t.test("rejects invalid order with INVALID_ORDER_VALUE", () => {
    const params = new URLSearchParams("order=sideways");
    const result = parseAgentListParams(params);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.code, "INVALID_ORDER_VALUE");
    }
  });

  await t.test("ignores unknown query parameters without failing", () => {
    const params = new URLSearchParams("unknownParam=ignoredValue&anotherUnknown=123");
    const result = parseAgentListParams(params);
    assert.equal(result.success, true);
  });

  await t.test("rejects malformed CUID with INVALID_ID", () => {
    const result = validateIdParam("123-invalid-id");
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.code, "INVALID_ID");
    }
  });

  await t.test("accepts valid CUID format", () => {
    const result = validateIdParam("cjld2cjxh0000qzrmn831i7rn");
    assert.equal(result.success, true);
  });

  await t.test("generates standard success list envelope shape", async () => {
    const response = successListResponse([{ id: "1", name: "Agent Test" }], {
      total: 100,
      limit: 20,
      offset: 0,
      hasMore: true,
    });
    const body = await response.json();
    assert.ok(Array.isArray(body.data));
    assert.deepEqual(body.meta, {
      total: 100,
      limit: 20,
      offset: 0,
      hasMore: true,
    });
  });

  await t.test("generates standard error envelope shape", async () => {
    const response = errorResponse("NOT_FOUND", "Agent not found.", 404);
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.deepEqual(body, {
      error: {
        code: "NOT_FOUND",
        message: "Agent not found.",
      },
    });
  });
});
