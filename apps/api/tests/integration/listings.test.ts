import test from "node:test";
import assert from "node:assert/strict";
import { parseListingListParams, validateIdParam } from "../../lib/validation";
import { successSingleResponse } from "../../lib/envelope";

test("GET /api/v1/listings validation and envelope tests", async (t) => {
  await t.test("clamps limit above 100 to 100 silently", () => {
    const params = new URLSearchParams("limit=200");
    const result = parseListingListParams(params);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.limit, 100);
    }
  });

  await t.test("rejects negative offset with INVALID_OFFSET", () => {
    const params = new URLSearchParams("offset=-1");
    const result = parseListingListParams(params);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.code, "INVALID_OFFSET");
    }
  });

  await t.test("rejects invalid sort field with INVALID_SORT_FIELD", () => {
    const params = new URLSearchParams("sort=neighborhood");
    const result = parseListingListParams(params);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.code, "INVALID_SORT_FIELD");
      assert.match(result.error.message, /price, createdAt, bedrooms/);
    }
  });

  await t.test("rejects invalid order with INVALID_ORDER_VALUE", () => {
    const params = new URLSearchParams("order=invalid_order");
    const result = parseListingListParams(params);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.code, "INVALID_ORDER_VALUE");
    }
  });

  await t.test("rejects invalid category with INVALID_FILTER_VALUE", () => {
    const params = new URLSearchParams("category=lease_to_own");
    const result = parseListingListParams(params);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.code, "INVALID_FILTER_VALUE");
    }
  });

  await t.test("accepts valid category values (sale, rent)", () => {
    const saleResult = parseListingListParams(new URLSearchParams("category=sale"));
    assert.equal(saleResult.success, true);
    if (saleResult.success) {
      assert.equal(saleResult.data.category, "sale");
    }

    const rentResult = parseListingListParams(new URLSearchParams("category=rent"));
    assert.equal(rentResult.success, true);
    if (rentResult.success) {
      assert.equal(rentResult.data.category, "rent");
    }
  });

  await t.test("ignores unknown query parameters without failing", () => {
    const params = new URLSearchParams("foo=bar&baz=123");
    const result = parseListingListParams(params);
    assert.equal(result.success, true);
  });

  await t.test("rejects malformed CUID with INVALID_ID", () => {
    const result = validateIdParam("abc1234");
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.code, "INVALID_ID");
    }
  });

  await t.test("generates single item success envelope shape with omitted meta", async () => {
    const response = successSingleResponse({
      id: "cjld2cjxh0000qzrmn831i7rn",
      title: "Sample Listing",
      price: 45000000,
    });
    const body = await response.json();
    assert.ok(body.data && typeof body.data === "object");
    assert.equal(body.meta, undefined);
    assert.equal(body.data.price, 45000000);
  });
});
