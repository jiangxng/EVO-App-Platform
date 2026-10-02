/**
 * Eidos 3D Core public entrypoint.
 *
 * This is a compatibility-preserving public boundary over the existing
 * spatial implementation assets. Product/domain semantics must stay outside
 * this module and renderer implementations remain replaceable adapters.
 */
export * from "../spatial/index.js";
