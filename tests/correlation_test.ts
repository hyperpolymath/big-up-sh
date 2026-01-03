// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Tests for correlation ID support
 */

import { assertEquals, assertMatch } from "@std/assert";
import { afterEach, describe, it } from "@std/testing/bdd";
import {
  createProcedureContext,
  generateCorrelationId,
  getCorrelationId,
  initCorrelationId,
  isValidCorrelationId,
  resetCorrelationId,
} from "../mod.ts";

describe("Correlation ID", () => {
  afterEach(() => {
    resetCorrelationId();
  });

  it("should generate valid correlation IDs", () => {
    const id = generateCorrelationId();
    assertMatch(id, /^corr-[a-f0-9]{16}$/);
  });

  it("should generate unique correlation IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateCorrelationId());
    }
    assertEquals(ids.size, 100, "All generated IDs should be unique");
  });

  it("should initialize with provided ID", () => {
    const providedId = "corr-1234567890abcdef";
    const result = initCorrelationId(providedId);
    assertEquals(result, providedId);
    assertEquals(getCorrelationId(), providedId);
  });

  it("should auto-generate ID when not provided", () => {
    const result = initCorrelationId();
    assertMatch(result, /^corr-[a-f0-9]{16}$/);
    assertEquals(getCorrelationId(), result);
  });

  it("should not re-initialize once set", () => {
    const first = initCorrelationId();
    const second = initCorrelationId("corr-different0000000");
    assertEquals(first, second, "Should return the first initialized ID");
  });

  it("should validate correlation ID format", () => {
    assertEquals(isValidCorrelationId("corr-1234567890abcdef"), true);
    assertEquals(isValidCorrelationId("corr-ABCDEF1234567890"), false); // uppercase
    assertEquals(isValidCorrelationId("corr-123"), false); // too short
    assertEquals(isValidCorrelationId("correlation-1234567890abcdef"), false); // wrong prefix
    assertEquals(isValidCorrelationId(""), false);
  });

  it("should reset correlation ID", () => {
    initCorrelationId("corr-1234567890abcdef");
    assertEquals(getCorrelationId(), "corr-1234567890abcdef");
    resetCorrelationId();
    assertEquals(getCorrelationId(), null);
  });
});

describe("Procedure Context", () => {
  afterEach(() => {
    resetCorrelationId();
  });

  it("should create context with required fields", () => {
    const ctx = createProcedureContext({ procedureId: "proc-001" });
    assertEquals(ctx.procedureId, "proc-001");
    assertMatch(ctx.correlationId, /^corr-[a-f0-9]{16}$/);
    assertEquals(ctx.source, "manual");
    assertEquals(ctx.dryRun, false);
  });

  it("should use provided correlation ID", () => {
    const ctx = createProcedureContext({
      procedureId: "proc-002",
      correlationId: "corr-abcdef1234567890",
    });
    assertEquals(ctx.correlationId, "corr-abcdef1234567890");
  });

  it("should support emergency-room source", () => {
    const ctx = createProcedureContext({
      procedureId: "proc-003",
      source: "emergency-room",
      correlationId: "corr-emergency123456",
    });
    assertEquals(ctx.source, "emergency-room");
  });

  it("should support dry-run mode", () => {
    const ctx = createProcedureContext({
      procedureId: "proc-004",
      dryRun: true,
    });
    assertEquals(ctx.dryRun, true);
  });
});
