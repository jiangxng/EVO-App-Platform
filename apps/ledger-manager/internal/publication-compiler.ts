import { createLedgerRuntimeConfiguratorService } from "../../ledger-runtime-configurator/service.js";
import type { LedgerRuntimeTemplateV010 } from "../../ledger-runtime-configurator/contracts.js";
import type { CompiledLedgerRuntimeConfigurationV010 } from "../../ledger-runtime-configurator/expression-compiler.js";

/** Internal publication dependency. No installation lookup, shared draft or runtime I/O. */
export function compileLedgerDefinitionForPublicationV010(
  template: LedgerRuntimeTemplateV010
): CompiledLedgerRuntimeConfigurationV010 {
  // Reuse the compatibility engine; each publication gets isolated working state.
  const compiler = createLedgerRuntimeConfiguratorService();
  const validation = compiler.importTemplate(template);
  if (!validation.ok || !validation.burn.ready) {
    throw new Error(
      "LEDGER_MANAGER_TEMPLATE_NOT_RUNTIME_READY: "
      + JSON.stringify({ errors: validation.errors, blockers: validation.burn.blockers })
    );
  }
  return compiler.compileCurrent();
}
