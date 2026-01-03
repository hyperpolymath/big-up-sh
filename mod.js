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
];

/**
 * Required documentation files for a complete pack
 */
export const REQUIRED_DOCS = [
  "ANTI-FEARWARE.adoc",
  "CLAIMS_POLICY.adoc",
];

/**
 * Validate that a pack directory has required files
 * @param {string[]} files - List of files in the pack directory
 * @returns {{valid: boolean, missing: string[]}} Validation result
 */
export function validatePackStructure(files) {
  const missing = REQUIRED_DOCS.filter((doc) => !files.includes(doc));
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Check if a hook exists in the hooks directory
 * @param {string} name - Hook name to validate
 * @returns {boolean} True if valid hook name
 */
export function isValidHook(name) {
  return HOOKS.includes(name);
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

let globalCorrelationId = null;

/**
 * Generate a new correlation ID
 * Format: corr-{timestamp_hex}{random_hex} (16 hex chars total)
 * @returns {string} New correlation ID
 */
export function generateCorrelationId() {
  const timestamp = Date.now().toString(16).slice(-8).padStart(8, "0");
  const random = Math.random().toString(16).slice(2, 10).padStart(8, "0");
  return `corr-${timestamp}${random}`;
}

/**
 * Initialize the global correlation ID
 * Uses provided ID or generates a new one
 * @param {string} [provided] - Optional correlation ID to use
 * @returns {string} The initialized correlation ID
 */
export function initCorrelationId(provided) {
  if (globalCorrelationId === null) {
    globalCorrelationId = provided ?? generateCorrelationId();
  }
  return globalCorrelationId;
}

/**
 * Get the current global correlation ID
 * @returns {string|null} Current correlation ID or null
 */
export function getCorrelationId() {
  return globalCorrelationId;
}

/**
 * Reset the global correlation ID (mainly for testing)
 */
export function resetCorrelationId() {
  globalCorrelationId = null;
}

/**
 * Validate a correlation ID format
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid format
 */
export function isValidCorrelationId(id) {
  return /^corr-[a-f0-9]{16}$/.test(id);
}

// =============================================================================
// Procedure Context for Theatre Operations
// =============================================================================

/**
 * Create a new procedure context
 * @param {Object} options - Context options
 * @param {string} options.procedureId - Required procedure ID
 * @param {string} [options.correlationId] - Optional correlation ID
 * @param {Date} [options.startedAt] - Optional start time
 * @param {string} [options.source] - Source: "emergency-room" | "psa" | "manual" | "scheduled"
 * @param {boolean} [options.dryRun] - Whether this is a dry run
 * @returns {{correlationId: string, procedureId: string, startedAt: Date, source: string, dryRun: boolean}} Procedure context
 */
export function createProcedureContext(options) {
  return {
    correlationId: options.correlationId ?? initCorrelationId(),
    procedureId: options.procedureId,
    startedAt: options.startedAt ?? new Date(),
    source: options.source ?? "manual",
    dryRun: options.dryRun ?? false,
  };
}
