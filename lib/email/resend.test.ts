import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "./resend";

const INPUT = { to: "ops@tarot.vn", subject: "Cảnh báo", text: "Nội dung" };

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
  vi.stubEnv("ALERT_EMAIL_FROM", "alert@example.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sendEmail", () => {
  it("posts the message to Resend with the API key", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "abc" }) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendEmail(INPUT)).resolves.toBe(true);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.headers.Authorization).toBe("Bearer re_test_key");
    expect(JSON.parse(options.body)).toEqual({
      from: "alert@example.com",
      to: ["ops@tarot.vn"],
      subject: "Cảnh báo",
      text: "Nội dung",
    });
  });

  it("returns false instead of throwing when Resend rejects the request", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 422, text: async () => "domain not verified" }),
    );

    await expect(sendEmail(INPUT)).resolves.toBe(false);
  });

  it("returns false instead of throwing when the network fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));

    await expect(sendEmail(INPUT)).resolves.toBe(false);
  });

  it("skips quietly when RESEND_API_KEY is not configured, so local dev still runs", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendEmail(INPUT)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips quietly when no from address is configured", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("ALERT_EMAIL_FROM", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendEmail(INPUT)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["e2e-1@example.com", "a@sub.example.org", "x@thu.test", "y@host.invalid"])(
    "skips reserved test domains instead of letting Resend reject %s",
    async (to) => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      await expect(sendEmail({ ...INPUT, to })).resolves.toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("still sends to look-alike domains that are not reserved", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendEmail({ ...INPUT, to: "ban@myexample.com" })).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
