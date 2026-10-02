import {
  diagramEditorOperationRequestV010,
  diagramEditorReadRequestV010,
  isDiagramEditorPageV010,
  mountDiagramEditorPageV010,
  renderDiagramEditorPageShellToHtmlV010,
  validateDiagramEditorStateV010
} from "./surface.js";
import type {
  DiagramEditorActionV010,
  DiagramEditorCommandV010,
  DiagramEditorEdgeV010,
  DiagramEditorNodeV010,
  DiagramEditorPageV010,
  DiagramEditorReadPresetV010,
  DiagramEditorStateValidationV010,
  DiagramEditorStateV010,
  DiagramInspectorPropertyEditorV010,
  DiagramInspectorPropertyV010,
  DiagramInspectorPropertyValueV010,
  DiagramInspectorSelectOptionV010,
  DiagramObservationBadgeV010,
  MountDiagramEditorPageOptionsV010,
  MountedDiagramEditorPageV010
} from "./surface.js";

/**
 * Neutral 2D Workspace names over the established diagram surface contract.
 *
 * The serialized v0.1 page contract intentionally remains compatible with
 * kind="diagram-editor". Editing is an optional capability expressed by
 * actions / Inspector editor descriptors, not by the identity of the surface.
 */
export type DiagramWorkspaceCommandV010 = DiagramEditorCommandV010;
export type DiagramWorkspaceReadPresetV010 = DiagramEditorReadPresetV010;
export type DiagramWorkspacePageV010 = DiagramEditorPageV010;
export type DiagramWorkspaceNodeV010 = DiagramEditorNodeV010;
export type DiagramWorkspaceEdgeV010 = DiagramEditorEdgeV010;
export type DiagramWorkspaceActionV010 = DiagramEditorActionV010;
export type DiagramWorkspaceStateV010 = DiagramEditorStateV010;
export type DiagramWorkspaceStateValidationV010 =
  DiagramEditorStateValidationV010;
export type DiagramWorkspaceObservationBadgeV010 =
  DiagramObservationBadgeV010;
export type DiagramWorkspaceInspectorPropertyValueV010 =
  DiagramInspectorPropertyValueV010;
export type DiagramWorkspaceInspectorSelectOptionV010 =
  DiagramInspectorSelectOptionV010;
export type DiagramWorkspaceInspectorPropertyEditorV010 =
  DiagramInspectorPropertyEditorV010;
export type DiagramWorkspaceInspectorPropertyV010 =
  DiagramInspectorPropertyV010;
export type MountDiagramWorkspacePageOptionsV010 =
  MountDiagramEditorPageOptionsV010;
export type MountedDiagramWorkspacePageV010 =
  MountedDiagramEditorPageV010;

export const isDiagramWorkspacePageV010 =
  isDiagramEditorPageV010;
export const validateDiagramWorkspaceStateV010 =
  validateDiagramEditorStateV010;
export const diagramWorkspaceReadRequestV010 =
  diagramEditorReadRequestV010;
export const diagramWorkspaceOperationRequestV010 =
  diagramEditorOperationRequestV010;
export const renderDiagramWorkspacePageShellToHtmlV010 =
  renderDiagramEditorPageShellToHtmlV010;
export const mountDiagramWorkspacePageV010 =
  mountDiagramEditorPageV010;
