import type { EnterpriseOperatingGraphHostServiceV010 } from "./enterprise-operating-graph-service.js";
import type { EogExpectedSopServiceV010 } from "./enterprise-operating-graph-sop-service.js";

/** Preserve synchronous public contracts; registration alone creates no service.
 * Caller-owned authorization/lifecycle checks must run before invoking methods.
 * These services own no connections, timers or user-specific caches.
 */
export function createOnUseEogServicesV010(input: {
  createGraph(): EnterpriseOperatingGraphHostServiceV010;
  createSop(graph: EnterpriseOperatingGraphHostServiceV010): EogExpectedSopServiceV010;
}): { graph: EnterpriseOperatingGraphHostServiceV010; sop: EogExpectedSopServiceV010 } {
  let graphInstance: EnterpriseOperatingGraphHostServiceV010 | undefined;
  let sopInstance: EogExpectedSopServiceV010 | undefined;
  const graph = () => graphInstance ??= input.createGraph();
  // Pass the facade: SOP list/history need the repository, not the graph service.
  const sop = () => sopInstance ??= input.createSop(graphFacade);
  const graphFacade: EnterpriseOperatingGraphHostServiceV010 = {
    get: request => graph().get(request),
    list: request => graph().list(request),
    create: request => graph().create(request),
    apply: request => graph().apply(request),
    validate: request => graph().validate(request)
  };
  return {
    graph: graphFacade,
    sop: {
      create: request => sop().create(request),
      revise: request => sop().revise(request),
      publish: request => sop().publish(request),
      list: request => sop().list(request),
      listPublished: request => sop().listPublished(request),
      history: request => sop().history(request)
    }
  };
}
