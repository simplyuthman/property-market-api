import test from "node:test";
import assert from "node:assert/strict";
import { parseViewingListParams, validateIdParam } from "../../lib/validation";
import { maskEmail } from "../../lib/mask-email";

test("GET /api/v1/viewings validation and masking tests", async (t) => {
  await t.test("clamps limit above 100 to 100 silently", () => {
    const params = new URLSearchParams("limit=500");
    const result = parseViewingListParams(params);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.limit, 100);
    }
  });

  await t.test("rejects negative offset with INVALID_OFFSET", () => {
    const params = new URLSearchParams("offset=-10");
    const result = parseViewingListParams(params);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.code, "INVALID_OFFSET");
    }
  });

  await t.test("rejects invalid sort field with INVALID_SORT_FIELD", () => {
    const params = new URLSearchParams("sort=visitorName");
    const result = parseViewingListParams(params);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.code, "INVALID_SORT_FIELD");
      assert.match(result.error.message, /scheduledAt, createdAt/);
    }
  });

  await t.test("rejects invalid order with INVALID_ORDER_VALUE", () => {
    const params = new URLSearchParams("order=backwards");
    const result = parseViewingListParams(params);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.code, "INVALID_ORDER_VALUE");
    }
  });

  await t.test("rejects invalid status with INVALID_FILTER_VALUE", () => {
    const params = new URLSearchParams("status=pending_confirmation");
    const result = parseViewingListParams(params);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.code, "INVALID_FILTER_VALUE");
      assert.match(result.error.message, /scheduled, completed, cancelled/);
    }
  });

  await t.test("accepts valid status filters (scheduled, completed, cancelled)", () => {
    const statuses = ["scheduled", "completed", "cancelled"] as const;
    for (const status of statuses) {
      const result = parseViewingListParams(new URLSearchParams(`status=${status}`));
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.status, status);
      }
    }
  });

  await t.test("rejects malformed listingId filter with INVALID_ID", () => {
    const params = new URLSearchParams("listingId=bad_cuid");
    const result = parseViewingListParams(params);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.code, "INVALID_ID");
    }
  });

  await t.test("accepts valid listingId filter", () => {
    const params = new URLSearchParams("listingId=cjld2cjxh0000qzrmn831i7rn");
    const result = parseViewingListParams(params);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.listingId, "cjld2cjxh0000qzrmn831i7rn");
    }
  });

  await t.test("masks visitor email correctly to domain only", () => {
    assert.equal(maskEmail("alice.smith@example.com"), "***@example.com");
    assert.equal(maskEmail("test.user+tag@domain.co.uk"), "***@domain.co.uk");
    assert.equal(maskEmail("john@sub.domain.org"), "***@sub.domain.org");
    assert.equal(maskEmail("invalid-email"), "***");
  });
});
