import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { setReflectionEnabledAction } from "@/app/actions/admin";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  transaction: vi.fn(),
  upsert: vi.fn(),
  audit: vi.fn(),
}));
vi.mock("@/lib/auth/admin", () => ({ getAdminUser: mocks.admin }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("@/lib/payments/orders", () => ({ refundOrder: vi.fn(), reconcileOrder: vi.fn() }));
vi.mock("@/lib/monitoring/report", () => ({ reportHandledError: vi.fn(), reportHandledIssue: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("GEMINI_API_KEY", "test-key");
  mocks.admin.mockResolvedValue({ id: "admin" });
  mocks.transaction.mockImplementation(callback =>
    callback({ appSetting: { upsert: mocks.upsert }, adminAuditLog: { create: mocks.audit } }),
  );
});
afterEach(() => vi.unstubAllEnvs());

it("rejects a non-admin before writing settings", async () => {
  mocks.admin.mockResolvedValue(null);
  expect(await setReflectionEnabledAction(true)).toMatchObject({ ok: false });
  expect(mocks.transaction).not.toHaveBeenCalled();
});

it.each([true, false])("saves and audits the explicit enabled value %s", async enabled => {
  const value = enabled ? "1" : "0";
  expect(await setReflectionEnabledAction(enabled)).toMatchObject({ ok: true });
  expect(mocks.upsert).toHaveBeenCalledWith({
    where: { key: "ai.reflection.enabled" },
    create: { key: "ai.reflection.enabled", value, updatedBy: "admin" },
    update: { value, updatedBy: "admin" },
  });
  expect(mocks.audit).toHaveBeenCalledWith({
    data: expect.objectContaining({ adminUserId: "admin", action: "reflection_setting_change" }),
  });
});

it("allows disabling when the provider key is missing", async () => {
  vi.stubEnv("GEMINI_API_KEY", "");
  expect(await setReflectionEnabledAction(true)).toMatchObject({ ok: false });
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(await setReflectionEnabledAction(false)).toMatchObject({ ok: true });
});
