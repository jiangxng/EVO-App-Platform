export {
  EOG_2D_PACKAGE_ID as EOG_2D_DESIGNER_PACKAGE_ID,
  EOG_2D_DESIGNER_FEATURE_ID,
  EOG_2D_DESIGNER_CAPABILITY,
  EOG_2D_DESIGNER_EXPERIENCE_ID,
  EOG_2D_DESIGNER_PAGE_ID,
  EOG_2D_DESIGNER_PAGE_SOURCE,
  EOG_2D_DESIGNER_ROUTE,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_PAGE_ID,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_PAGE_SOURCE,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_ROUTE,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_SELECTION_GET_ACTION,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
  eog2dPackage as eog2dDesignerPackage
} from "../eog-2d/package.js";

// Lightweight identities for Host registration. Legacy implementation modules
// re-export these names without changing their public command contracts.
export const EOG_CREATE_ACTION = "enterprise-operating-graph.create";
export const EOG_GET_ACTION = "enterprise-operating-graph.get";
export const EOG_LIST_ACTION = "enterprise-operating-graph.list";
export const EOG_VALIDATE_ACTION = "enterprise-operating-graph.validate";
export const EOG_APPLY_OPERATION_ACTION = "enterprise-operating-graph.operation.apply";
export const EOG_VIEW_GET_ACTION = "enterprise-operating-graph.view.get";
export const EOG_VIEW_OPERATION_ACTION = "enterprise-operating-graph.view.operation";
export const EOG_VIEW_SELECTION_GET_ACTION = "enterprise-operating-graph.view.selection.get";

