import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createPersonalAgentExperienceProfileV010
} from "../../dist/manager/local-experience-profile.js";
import {
  parseHostStaticSessionV010
} from "../../dist/providers/session/runtime.js";
import {
  createHostStaticAuthorizationProviderV010,
  parseHostStaticAuthorizationPolicyV010
} from "../../dist/providers/authorization/runtime.js";
import {
  HOST_STATIC_AUTHORIZATION_PROVIDER_ID
} from "../../dist/providers/authorization/package.js";
import {
  HOST_STATIC_SESSION_PROVIDER_ID
} from "../../dist/providers/session/package.js";
import {
  ENTERPRISE_AGENT_SETUP_PAGE_SOURCE
} from "../../dist/agents/enterprise-agent/package.js";
import {
  OPENAI_LLM_PACKAGE_ID
} from "../../dist/providers/openai/package.js";
import {
  settingsPackagePageSource
} from "../../dist/manager/settings-page.js";

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  await new Promise(resolve => server.close(resolve));
  if (!port) throw new Error("TEST_PORT_UNAVAILABLE");
  return port;
}

function settingsFields(definition) {
  if (Array.isArray(definition.settings)) return definition.settings;
  if (Array.isArray(definition.groups)) {
    return definition.groups.flatMap(group =>
      Array.isArray(group?.settings) ? group.settings : []
    );
  }
  return [];
}

async function waitForJson(url, options) {
  let lastError;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return {
          response,
          body: await response.json()
        };
      }
      lastError = new Error("HTTP_" + response.status);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw lastError ?? new Error("SERVER_START_TIMEOUT");
}

function action(code, values, id) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code,
      inputVersion: "0.1.0"
    },
    values,
    sourceInteractionId: "experience-checkpoint:" + id,
    actionId: id,
    requiresConfirmation: true
  };
}

test("local experience profile uses formal Session and Authorization Provider contracts", async () => {
  const profile = createPersonalAgentExperienceProfileV010({
    PATH: process.env.PATH,
    APP_PLATFORM_EXPERIENCE_SUBJECT_ID: "checkpoint-user",
    APP_PLATFORM_EXPERIENCE_ADMIN_TOKEN: "checkpoint-admin",
    APP_PLATFORM_STATE_FILE: "./.local/test-checkpoint/state.json"
  });

  const session = parseHostStaticSessionV010(
    profile.environment.APP_PLATFORM_STATIC_SESSION_JSON
  );
  assert.equal(session.principal.subjectId, "checkpoint-user");
  assert.equal(session.principal.actorType, "HUMAN");
  assert.equal(session.principal.identityProviderId, "host.static-session");

  const policy = parseHostStaticAuthorizationPolicyV010(
    profile.environment.APP_PLATFORM_AUTHORIZATION_POLICY_JSON
  );
  const provider = createHostStaticAuthorizationProviderV010(policy);

  const material = await provider.check({
    contractVersion: "0.1.0",
    principal: session.principal,
    scope: {
      contractVersion: "0.1.0",
      userId: "checkpoint-user"
    },
    action: "context.memory.record",
    resource: {
      type: "context.memory"
    }
  });
  assert.equal(material.allowed, true);

  const bootstrap = await provider.check({
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "bootstrap-admin",
      actorType: "HUMAN",
      identityProviderId: "host.bootstrap"
    },
    scope: {
      contractVersion: "0.1.0"
    },
    action: "secret.value.manage",
    resource: {
      type: "package-secret"
    }
  });
  assert.equal(bootstrap.allowed, true);

  const unrelated = await provider.check({
    contractVersion: "0.1.0",
    principal: {
      ...session.principal,
      subjectId: "someone-else"
    },
    scope: {
      contractVersion: "0.1.0",
      userId: "someone-else"
    },
    action: "context.memory.record",
    resource: {
      type: "context.memory"
    }
  });
  assert.equal(unrelated.allowed, false);
});

test("vertical experience boots one Host and reaches real Provider configuration through public contracts", async t => {
  const directory = mkdtempSync(join(tmpdir(), "evo-personal-agent-checkpoint-"));
  const stateFile = join(directory, "state.json");
  const port = await freePort();
  const profile = createPersonalAgentExperienceProfileV010({
    ...process.env,
    PORT: String(port),
    OPENAI_API_KEY: "",
    APP_PLATFORM_STATE_FILE: stateFile,
    APP_PLATFORM_EXPERIENCE_SUBJECT_ID: "checkpoint-user",
    APP_PLATFORM_EXPERIENCE_ADMIN_TOKEN: "checkpoint-admin"
  });

  let output = "";
  const child = spawn(
    process.execPath,
    ["dist/manager/server.js"],
    {
      env: profile.environment,
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  child.stdout.on("data", chunk => {
    output += chunk.toString();
  });
  child.stderr.on("data", chunk => {
    output += chunk.toString();
  });

  t.after(async () => {
    if (child.exitCode === null) {
      child.kill("SIGTERM");
      await new Promise(resolve => {
        child.once("exit", resolve);
        setTimeout(resolve, 3000).unref();
      });
    }
    rmSync(directory, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    const health = await waitForJson(baseUrl + "/health");
    assert.equal(health.body.ok, true);

    const contexts = await waitForJson(baseUrl + "/v1/contexts/effective");
    assert.equal(contexts.body.session.principal.subjectId, "checkpoint-user");
    assert.equal(
      contexts.body.session.principal.identityProviderId,
      "host.static-session"
    );

    const sessionProviders = await waitForJson(
      baseUrl + "/v1/providers/effective?capability=identity.session"
    );
    assert.ok(
      sessionProviders.body.some(
        provider => provider.providerId === HOST_STATIC_SESSION_PROVIDER_ID
      )
    );

    const authorizationProviders = await waitForJson(
      baseUrl + "/v1/providers/effective?capability=authorization.check"
    );
    assert.ok(
      authorizationProviders.body.some(
        provider => provider.providerId === HOST_STATIC_AUTHORIZATION_PROVIDER_ID
      )
    );

    const auditResponse = await fetch(baseUrl + "/v1/providers/audit", {
      headers: {
        authorization: "Bearer checkpoint-admin",
        accept: "application/json"
      }
    });
    assert.equal(auditResponse.status, 200);

    for (const [packageId, id] of [
      ["enterprise-agent", "install-personal-agent"],
      [OPENAI_LLM_PACKAGE_ID, "install-openai-provider"]
    ]) {
      const response = await fetch(baseUrl + "/v1/actions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify(action(
          "app-platform.install-package",
          {
            itemId: packageId,
            confirmed: true
          },
          id
        ))
      });
      const body = await response.json();
      assert.equal(
        response.status,
        200,
        JSON.stringify({ packageId, body, output })
      );
      assert.equal(body.ok, true);
    }

    const experiences = await waitForJson(
      baseUrl + "/v1/experiences/effective"
    );
    const personalAgentExperience = experiences.body.find(
      experience => experience.packageId === "enterprise-agent"
    );
    assert.ok(personalAgentExperience);
    assert.ok(
      personalAgentExperience.routes.some(
        route => route.path === "/enterprise-agent/setup"
      )
    );
    assert.ok(
      personalAgentExperience.routes.some(
        route => route.path === "/enterprise-agent/quality"
      )
    );
    assert.ok(
      personalAgentExperience.routes.some(
        route => route.path === "/enterprise-agent/follow-ups"
      )
    );

    const setupUrl = new URL(baseUrl + "/v1/experience-pages");
    setupUrl.searchParams.set("source", ENTERPRISE_AGENT_SETUP_PAGE_SOURCE);
    const setup = await waitForJson(setupUrl.toString());
    assert.equal(setup.body.kind, "setup-flow");
    const credentials = setup.body.steps.find(step => step.id === "credentials");
    assert.equal(credentials.state, "current");
    assert.equal(
      credentials.primaryAction.route,
      "/settings/openai-llm-provider"
    );

    const settingsUrl = new URL(baseUrl + "/v1/experience-pages");
    settingsUrl.searchParams.set(
      "source",
      settingsPackagePageSource(OPENAI_LLM_PACKAGE_ID)
    );
    const settings = await waitForJson(settingsUrl.toString());
    assert.equal(settings.body.kind, "settings-editor");
    assert.equal(settings.body.contractVersion, "0.2.0");
    const fields = settingsFields(settings.body);
    assert.ok(
      fields.some(setting => setting.key === "secret:apiKey")
    );
    assert.ok(
      fields.some(setting => setting.key === "adminToken")
    );

    const root = await fetch(baseUrl + "/");
    const html = await root.text();
    assert.equal(root.status, 200);
    assert.equal(root.headers.get("cache-control"), "no-store");
    assert.ok(root.headers.get("etag"));
    assert.match(html, /EVO/);
    assert.match(
      html,
      /\/assets\/[a-zA-Z0-9._-]+\/manager\/app-host-client\.js/
    );
  } catch (error) {
    throw new Error(
      (error instanceof Error ? error.message : String(error))
      + "\nSERVER OUTPUT:\n"
      + output
    );
  }
});
