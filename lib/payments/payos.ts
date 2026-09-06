import "server-only";
import crypto from "crypto";

const PAYOS_API_BASE = "https://api-merchant.payos.vn";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name} cho PayOS.`);
  return value;
}

/**
 * PayOS ký dữ liệu bằng cách sắp xếp key theo alphabet, nối "key=value" bằng
 * "&", rồi HMAC-SHA256 chuỗi đó với checksum key. Áp dụng chung cho cả tạo
 * link thanh toán lẫn xác minh webhook.
 */
function signData(data: Record<string, unknown>, checksumKey: string): string {
  const sorted = Object.keys(data).sort();
  const queryStr = sorted
    .map((key) => {
      const value = data[key];
      const normalized =
        value === null || value === undefined
          ? ""
          : Array.isArray(value) || typeof value === "object"
            ? JSON.stringify(value)
            : String(value);
      return `${key}=${normalized}`;
    })
    .join("&");
  return crypto.createHmac("sha256", checksumKey).update(queryStr).digest("hex");
}

export interface CreatePaymentLinkInput {
  orderCode: number;
  amountVnd: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CreatePaymentLinkResult {
  checkoutUrl: string;
  paymentLinkId: string;
}

export async function createPaymentLink(
  input: CreatePaymentLinkInput,
): Promise<CreatePaymentLinkResult> {
  const clientId = requireEnv("PAYOS_CLIENT_ID");
  const apiKey = requireEnv("PAYOS_API_KEY");
  const checksumKey = requireEnv("PAYOS_CHECKSUM_KEY");

  const body = {
    orderCode: input.orderCode,
    amount: input.amountVnd,
    description: input.description,
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
  };
  const signature = signData(body, checksumKey);

  const response = await fetch(`${PAYOS_API_BASE}/v2/payment-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ ...body, signature }),
  });

  const json = await response.json();
  if (!response.ok || json.code !== "00") {
    throw new Error(json.desc ?? "Không thể tạo link thanh toán PayOS.");
  }

  return {
    checkoutUrl: json.data.checkoutUrl,
    paymentLinkId: json.data.paymentLinkId,
  };
}

export interface PayosWebhookData {
  orderCode: number;
  amount: number;
  description: string;
  code: string;
  desc: string;
  [key: string]: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Xác minh chữ ký webhook PayOS. Trả về payload đã verify hoặc null nếu sai/thiếu field. */
export function verifyWebhookPayload(payload: unknown): PayosWebhookData | null {
  if (!isPlainObject(payload)) return null;
  const { data, signature } = payload;
  if (!isPlainObject(data) || typeof signature !== "string") return null;

  const checksumKey = requireEnv("PAYOS_CHECKSUM_KEY");
  const expected = signData(data, checksumKey);
  if (expected !== signature) return null;
  return data as PayosWebhookData;
}
