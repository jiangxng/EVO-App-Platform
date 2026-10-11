import {
  isSpatialObservatoryPageV010,
  mountSpatialObservatoryPageV010,
  renderSpatialObservatoryPageShellToHtmlV010,
  spatialObservatoryReadRequestV010,
  validateSpatialObservatoryStateV010
} from "./surface.js";
import type {
  MountSpatialObservatoryPageOptionsV010,
  MountedSpatialObservatoryPageV010,
  SpatialObservationBadgeV010,
  SpatialObservatoryLinkV010,
  SpatialObservatoryObjectV010,
  SpatialObservatoryPageV010,
  SpatialObservatoryReadPresetV010,
  SpatialObservatoryStateValidationV010,
  SpatialObservatoryStateV010
} from "./surface.js";

/**
 * Neutral 3D Workspace names over the existing spatial surface runtime.
 *
 * Runtime observations are optional decorations. A spatial Viewer can use the
 * same selection/navigation surface without becoming an Observatory product.
 */
export type SpatialWorkspacePageV010 = SpatialObservatoryPageV010;
export type SpatialWorkspaceReadPresetV010 = SpatialObservatoryReadPresetV010;
export type SpatialWorkspaceObjectV010 = SpatialObservatoryObjectV010;
export type SpatialWorkspaceLinkV010 = SpatialObservatoryLinkV010;
export type SpatialWorkspaceStateV010 = SpatialObservatoryStateV010;
export type SpatialWorkspaceStateValidationV010 =
  SpatialObservatoryStateValidationV010;
export type SpatialWorkspaceObservationBadgeV010 =
  SpatialObservationBadgeV010;
export type MountSpatialWorkspacePageOptionsV010 =
  MountSpatialObservatoryPageOptionsV010;
export type MountedSpatialWorkspacePageV010 =
  MountedSpatialObservatoryPageV010;

export const isSpatialWorkspacePageV010 = isSpatialObservatoryPageV010;
export const validateSpatialWorkspaceStateV010 =
  validateSpatialObservatoryStateV010;
export const spatialWorkspaceReadRequestV010 =
  spatialObservatoryReadRequestV010;
export const renderSpatialWorkspacePageShellToHtmlV010 =
  renderSpatialObservatoryPageShellToHtmlV010;
export const mountSpatialWorkspacePageV010 =
  mountSpatialObservatoryPageV010;
