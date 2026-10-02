import type {
  EnterpriseAgentToolRegistrationV010
} from "../agents/enterprise-agent/host-tool-catalog.js";
import type {
  PlatformPrincipalV010,
  ResolvedContextSetV010
} from "../contracts/platform-services.js";
import {
  createEog2dDesignerAgentToolRegistrationsV010
} from "../apps/eog-2d-designer/agent-tools.js";
import type {
  EnterpriseOperatingGraphHostServiceV010
} from "../apps/eog-2d-designer/enterprise-operating-graph-service.js";
import {
  createEog3dViewerAgentToolRegistrationsV010
} from "../apps/eog-3d-viewer/agent-tools.js";
import type {
  EnterpriseOperatingGraphViewHostServiceV010
} from "./enterprise-operating-graph-view-service.js";

export {
  createEog2dDesignerAgentToolRegistrationsV010,
  createEog3dViewerAgentToolRegistrationsV010
};

export function createEnterpriseOperatingGraphAgentToolRegistrationsV010(
  input: {
    service: EnterpriseOperatingGraphHostServiceV010;
    viewService: EnterpriseOperatingGraphViewHostServiceV010;
    principal: PlatformPrincipalV010;
    context: ResolvedContextSetV010;
    isDesignerActive?: () => boolean;
    is3dViewerActive?: () => boolean;
  }
): EnterpriseAgentToolRegistrationV010[] {
  return [
    ...createEog2dDesignerAgentToolRegistrationsV010({
      service: input.service,
      viewService: input.viewService,
      principal: input.principal,
      context: input.context,
      ...(input.isDesignerActive ? { isDesignerActive: input.isDesignerActive } : {})
    }),
    ...createEog3dViewerAgentToolRegistrationsV010({
      service: input.service,
      viewService: input.viewService,
      principal: input.principal,
      context: input.context,
      ...(input.is3dViewerActive ? { is3dViewerActive: input.is3dViewerActive } : {})
    })
  ];
}
