// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * System Operating Theatre - Orchestration Layer
 * D-layer (Drivers/Deployment/Delivery)
 *
 * Provides policy packs, validation hooks, and orchestration capabilities
 * for the system tools ecosystem.
 */

export const VERSION = "1.1.0";
export const SCHEMA_VERSION = "1.0";

/**
 * Available validation hooks
 */
export const HOOKS = [
  "validate-codeql.sh",
  "validate-permissions.sh",
  "validate-sha-pins.sh",
  "validate-spdx.sh",
] as const;

export type HookName = typeof HOOKS[number];

/**
 * Required documentation files for a complete pack
 */
export const REQUIRED_DOCS = [
  "ANTI-FEARWARE.adoc",
  "CLAIMS_POLICY.adoc",
] as const;

/**
 * Validate that a pack directory has required files
 */
export function validatePackStructure(files: string[]): {
  valid: boolean;
  missing: string[];
} {
  const missing = REQUIRED_DOCS.filter((doc) => !files.includes(doc));
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Check if a hook exists in the hooks directory
 */
export function isValidHook(name: string): name is HookName {
  return HOOKS.includes(name as HookName);
}

// =============================================================================
// Correlation ID Support for Cross-Tool Distributed Tracing
// =============================================================================

/**
 * Correlation ID format: corr-XXXXXXXXXXXXXXXX (corr- prefix + 16 hex chars)
 * Used for tracing operations across:
 * - system-emergency-room → system-operating-theatre
 * - system-operating-theatre → personal-sysadmin
 * - Procedure execution chains
 */

let globalCorrelationId: string | null = null;

/**
 * Generate a new correlation ID
 * Format: corr-{timestamp_hex}{random_hex} (16 hex chars total)
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(16).slice(-8).padStart(8, "0");
  const random = Math.random().toString(16).slice(2, 10).padStart(8, "0");
  return `corr-${timestamp}${random}`;
}

/**
 * Initialize the global correlation ID
 * Uses provided ID or generates a new one
 */
export function initCorrelationId(provided?: string): string {
  if (globalCorrelationId === null) {
    globalCorrelationId = provided ?? generateCorrelationId();
  }
  return globalCorrelationId;
}

/**
 * Get the current global correlation ID
 */
export function getCorrelationId(): string | null {
  return globalCorrelationId;
}

/**
 * Reset the global correlation ID (mainly for testing)
 */
export function resetCorrelationId(): void {
  globalCorrelationId = null;
}

/**
 * Validate a correlation ID format
 */
export function isValidCorrelationId(id: string): boolean {
  return /^corr-[a-f0-9]{16}$/.test(id);
}

// =============================================================================
// Procedure Context for Theatre Operations
// =============================================================================

/**
 * Context for a theatre procedure execution
 */
export interface ProcedureContext {
  correlationId: string;
  procedureId: string;
  startedAt: Date;
  source?: "emergency-room" | "psa" | "manual" | "scheduled";
  dryRun: boolean;
}

/**
 * Create a new procedure context
 */
export function createProcedureContext(
  options: Partial<ProcedureContext> & { procedureId: string },
): ProcedureContext {
  return {
    correlationId: options.correlationId ?? initCorrelationId(),
    procedureId: options.procedureId,
    startedAt: options.startedAt ?? new Date(),
    source: options.source ?? "manual",
    dryRun: options.dryRun ?? false,
  };
}
