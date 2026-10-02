export type Eog2dWorkspaceRoleV010 = "VIEWER" | "DESIGNER";

export interface Eog2dWorkspaceCapabilitiesV010 {
  inspectNode: boolean;
  inspectEdge: boolean;
  navigate: boolean;
  panZoomFocus: boolean;
  overlays: boolean;
  editNodeSemanticProperties: boolean;
  editEdgeSemanticProperties: boolean;
  createRemoveNodes: boolean;
  createRemoveReconnectRelations: boolean;
  confirmPublishDefinition: boolean;
}

export const EOG_2D_VIEWER_WORKSPACE_CAPABILITIES_V010:
  Eog2dWorkspaceCapabilitiesV010 = {
    inspectNode: true,
    inspectEdge: true,
    navigate: true,
    panZoomFocus: true,
    overlays: true,
    editNodeSemanticProperties: false,
    editEdgeSemanticProperties: false,
    createRemoveNodes: false,
    createRemoveReconnectRelations: false,
    confirmPublishDefinition: false
  };

export const EOG_2D_DESIGNER_WORKSPACE_CAPABILITIES_V010:
  Eog2dWorkspaceCapabilitiesV010 = {
    ...EOG_2D_VIEWER_WORKSPACE_CAPABILITIES_V010,
    editNodeSemanticProperties: true,
    editEdgeSemanticProperties: true,
    createRemoveNodes: true,
    createRemoveReconnectRelations: true,
    confirmPublishDefinition: true
  };
