import crypto from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPaymentLink, getPaymentLink, verifyWebhookPayload } from "./payos";

const CHECKSUM_KEY = "test-checksum-key";

function sign(data: Record<string, unknown>, checksumKey = CHECKSUM_KEY): string {
  const queryStr = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("&");
  return crypto.createHmac("sha256", checksumKey).update(queryStr).digest("hex");
}

beforeEach(() => {
  vi.stubEnv("PAYOS_CLIENT_ID", "test-client-id");
  vi.stubEnv("PAYOS_API_KEY", "test-api-key");
  vi.stubEnv("PAYOS_CHECKSUM_KEY", CHECKSUM_KEY);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("verifyWebhookPayload", () => {
  const data = { orderCode: 123, amount: 19000, description: "Nap 50 credit", code: "00", desc: "success" };

  it("accepts a payload signed with the real checksum key", () => {
    const result = verifyWebhookPayload({ data, signature: sign(data) });
    expect(result).toEqual(data);
  });

  it("rejects a payload whose amount was tampered with after signing", () => {
    const signature = sign(data);
    const tampered = { ...data, amount: 1 };
    expect(verifyWebhookPayload({ data: tampered, signature })).toBeNull();
  });

  it("rejects a payload signed with the wrong checksum key", () => {
    const signature = sign(data, "wrong-key");
    expect(verifyWebhookPayload({ data, signature })).toBeNull();
  });

  it("rejects a payload missing the signature field", () => {
    expect(verifyWebhookPayload({ data })).toBeNull();
  });

  it("rejects a payload missing the data field", () => {
    expect(verifyWebhookPayload({ signature: sign(data) })).toBeNull();
  });

  it("rejects a non-object payload", () => {
    expect(verifyWebhookPayload(null)).toBeNull();
    expect(verifyWebhookPayload("not an object")).toBeNull();
    expect(verifyWebhookPayload(42)).toBeNull();
  });

  it("throws a clear error when PAYOS_CHECKSUM_KEY is not configured", () => {
    vi.stubEnv("PAYOS_CHECKSUM_KEY", "");
    expect(() => verifyWebhookPayload({ data, signature: sign(data) })).toThrow(
      "Thiếu biến môi trường PAYOS_CHECKSUM_KEY cho PayOS.",
    );
  });
});

describe("createPaymentLink", () => {
  const input = {
    orderCode: 123,
    amountVnd: 19000,
    description: "Nap 50 credit",
    returnUrl: "https://example.com/return",
    cancelUrl: "https://example.com/cancel",
  };

  it("signs the request body with the checksum key and returns the checkout URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: "00",
        desc: "success",
        data: {
          checkoutUrl: "https://pay.payos.vn/web/abc123",
          paymentLinkId: "abc123",
          orderCode: 123,
          amount: 19000,
          status: "PENDING",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createPaymentLink(input);

    expect(result).toEqual({
      checkoutUrl: "https://pay.payos.vn/web/abc123",
      paymentLinkId: "abc123",
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api-merchant.payos.vn/v2/payment-requests");
    expect(options.headers["x-client-id"]).toBe("test-client-id");
    expect(options.headers["x-api-key"]).toBe("test-api-key");

    const sentBody = JSON.parse(options.body);
    const { signature, ...unsigned } = sentBody;
    expect(unsigned).toEqual({
      orderCode: input.orderCode,
      amount: input.amountVnd,
      description: input.description,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
    });
    expect(signature).toBe(sign(unsigned));
  });

  it("keeps expiredAt out of the signature, since PayOS only signs five fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: "00",
        desc: "success",
        data: { checkoutUrl: "https://pay.payos.vn/web/abc123", paymentLinkId: "abc123" },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await createPaymentLink({ ...input, expiredAt: 1_800_000_000 });

    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentBody.expiredAt).toBe(1_800_000_000);
    // Chữ ký vẫn phải là chữ ký của đúng 5 field, không có expiredAt.
    expect(sentBody.signature).toBe(
      sign({
        orderCode: input.orderCode,
        amount: input.amountVnd,
        description: input.description,
        returnUrl: input.returnUrl,
        cancelUrl: input.cancelUrl,
      }),
    );
  });

  it("throws PayOS's own error message when the API rejects the request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ code: "20", desc: "Invalid client id" }),
      }),
    );

    await expect(createPaymentLink(input)).rejects.toThrow("Invalid client id");
  });
});

describe("getPaymentLink", () => {
  const okResponse = {
    code: "00",
    desc: "success",
    data: {
      id: "link_1",
      orderCode: 123,
      amount: 19000,
      amountPaid: 19000,
      status: "PAID",
    },
  };

  it("reads the current status of a payment link", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => okResponse });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPaymentLink("link_1")).resolves.toEqual({
      orderCode: 123,
      status: "PAID",
      amount: 19000,
      amountPaid: 19000,
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api-merchant.payos.vn/v2/payment-requests/link_1");
    expect(options.method).toBe("GET");
    expect(options.headers["x-client-id"]).toBe("test-client-id");
    expect(options.headers["x-api-key"]).toBe("test-api-key");
  });

  it("returns null when PayOS does not know the order", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ code: "101", desc: "Không tìm thấy đơn hàng" }),
      }),
    );

    await expect(getPaymentLink("nope")).resolves.toBeNull();
  });

  it("throws on any other PayOS error, so a caller never mistakes it for 'not paid'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ code: "20", desc: "Invalid client id" }),
      }),
    );

    await expect(getPaymentLink("link_1")).rejects.toThrow("Invalid client id");
  });

  it("defaults amountPaid to 0 when PayOS omits it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...okResponse,
          data: { ...okResponse.data, status: "PENDING", amountPaid: undefined },
        }),
      }),
    );

    await expect(getPaymentLink("link_1")).resolves.toMatchObject({
      status: "PENDING",
      amountPaid: 0,
    });
  });
});
