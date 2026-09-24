import test from "node:test";
import assert from "node:assert/strict";
import { appManagerInstallerHtml, ledgerConfiguratorMvpHtml } from "../dist/apps/ledger-runtime-configurator/mvp-page.js";

test("installer and configurator product surfaces are Eidos-rendered", () => {
  assert.match(appManagerInstallerHtml, /data-ui-runtime="eidos"/);
  assert.match(appManagerInstallerHtml, /data-eidos-id="app-platform\.install-plan"/);
  assert.match(appManagerInstallerHtml, /data-eidos-id="app-platform\.install-execute"/);
  assert.match(ledgerConfiguratorMvpHtml, /data-ui-runtime="eidos"/);
  assert.match(ledgerConfiguratorMvpHtml, /data-eidos-id="ledger-runtime-configurator\.rule-editor"/);
  assert.match(ledgerConfiguratorMvpHtml, /data-eidos-id="ledger-runtime-configurator\.business-data"/);
  assert.match(ledgerConfiguratorMvpHtml, /data-command="evo-ledger-runtime-configurator\.burn"/);
});
