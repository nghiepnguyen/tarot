import { describe, expect, it } from "vitest";
import { AI_MODELS, getModelPersona, RANDOM_AI_MODEL_VALUE } from "./models";

describe("bút danh của model", () => {
  it("gives every allowed model a persona", () => {
    for (const model of AI_MODELS) {
      expect(model.persona.trim().length, model.id).toBeGreaterThan(0);
    }
  });

  it("never lets two models share one persona", () => {
    // Hai model cùng một bút danh nghĩa là mọi điểm chấm gộp vào nhau và chế
    // độ ngẫu nhiên không còn so được gì — đó là cả lý do bút danh tồn tại.
    const personas = AI_MODELS.map((model) => model.persona);
    expect(new Set(personas).size).toBe(personas.length);
  });

  it("never uses a persona that could be read as the provider's name", () => {
    // Bút danh lộ nhà cung cấp thì người chấm không còn chấm mù.
    for (const model of AI_MODELS) {
      const persona = model.persona.toLowerCase();
      expect(persona, model.id).not.toContain(model.provider);
    }
  });

  it("returns null for a model that is no longer allowed", () => {
    // Row cũ sinh bằng Claude vẫn nằm trong database; giao diện bỏ hẳn dòng
    // "Tarot Reader" thay vì bịa tên cho một model đã gỡ.
    expect(getModelPersona("claude-haiku-4-5-20251001")).toBeNull();
  });

  it("does not hand out a persona for the random sentinel", () => {
    // `random` là một lệnh, không phải một model — không có ai ký tên nó.
    expect(getModelPersona(RANDOM_AI_MODEL_VALUE)).toBeNull();
  });
});
