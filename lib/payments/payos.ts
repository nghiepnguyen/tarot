import "server-only";
import crypto from "crypto";

const PAYOS_API_BASE = "https://api-merchant.payos.vn";

/**
 * Hạn chờ cho mỗi lượt gọi PayOS.
 *
 * `fetch` của Node không có hạn chờ tổng: một kết nối treo chỉ đứt sau 5 phút
 * (headers timeout của undici). Job đối soát chạy trên Vercel với trần 60
 * giây, nên một cuộc gọi treo là đủ để function bị giết giữa chừng — không kịp
 * đóng check-in, và Sentry báo cron timeout.
 */
const PAYOS_TIMEOUT_MS = 8_000;

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

function payosHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-client-id": requireEnv("PAYOS_CLIENT_ID"),
    "x-api-key": requireEnv("PAYOS_API_KEY"),
  };
}

export interface CreatePaymentLinkInput {
  orderCode: number;
  amountVnd: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  /** Unix timestamp (giây) link hết hạn. PayOS không đưa field này vào chữ ký. */
  expiredAt?: number;
}

export interface CreatePaymentLinkResult {
  checkoutUrl: string;
  paymentLinkId: string;
}

export async function createPaymentLink(
  input: CreatePaymentLinkInput,
): Promise<CreatePaymentLinkResult> {
  const checksumKey = requireEnv("PAYOS_CHECKSUM_KEY");

  // Chữ ký của payment request chỉ phủ đúng 5 field này theo quy ước PayOS,
  // không phải toàn bộ body. Thêm field khác (vd expiredAt) vào chuỗi ký sẽ
  // bị PayOS từ chối, nên giữ hai object tách bạch.
  const signedFields = {
    orderCode: input.orderCode,
    amount: input.amountVnd,
    description: input.description,
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
  };
  const signature = signData(signedFields, checksumKey);

  const body: Record<string, unknown> = { ...signedFields, signature };
  if (input.expiredAt !== undefined) body.expiredAt = input.expiredAt;

  const response = await fetch(`${PAYOS_API_BASE}/v2/payment-requests`, {
    method: "POST",
    headers: payosHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(PAYOS_TIMEOUT_MS),
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

/** Trạng thái PayOS trả về cho một payment link. */
export type PayosPaymentStatus = "PENDING" | "PROCESSING" | "PAID" | "CANCELLED" | "EXPIRED";

export interface PaymentLinkInfo {
  orderCode: number;
  status: PayosPaymentStatus;
  amount: number;
  amountPaid: number;
}

/**
 * Đọc trạng thái hiện tại của một payment link. Dùng để đối soát khi webhook
 * không tới (PayOS lỗi, deploy đúng lúc callback, mạng đứt).
 *
 * `id` nhận orderCode hoặc paymentLinkId. Trả về null nếu PayOS không biết
 * link đó — đơn chưa bao giờ được tạo bên phía họ.
 */
export async function getPaymentLink(id: string): Promise<PaymentLinkInfo | null> {
  const response = await fetch(
    `${PAYOS_API_BASE}/v2/payment-requests/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: payosHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(PAYOS_TIMEOUT_MS),
    },
  );

  const json = await response.json();
  // 101 = "Không tìm thấy đơn hàng" theo bảng mã PayOS.
  if (json.code === "101") return null;
  if (!response.ok || json.code !== "00") {
    throw new Error(json.desc ?? "Không đọc được trạng thái thanh toán PayOS.");
  }

  const data = json.data;
  return {
    orderCode: Number(data.orderCode),
    status: data.status as PayosPaymentStatus,
    amount: Number(data.amount),
    amountPaid: Number(data.amountPaid ?? 0),
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
