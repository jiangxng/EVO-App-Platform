# Agent-first App Host Workspace v0.1

**Status:** Architecture baseline
**Date:** 2026-09-24

## 1. Product decision

EVO App Platform originally used the Eidos Agent Workspace Shell to prove persistent Agent + Workspace composition. The canonical product shell has now evolved to the Eidos Workbench.

```text
Activity Bar = Apps / Agent / Plugins / Workspace / Settings
Side Panel   = current context (Apps navigation, Enterprise Agent, future Views)
Workspace    = active application / configurator / browser
Status Bar   = lightweight runtime/workspace context
```

This is not an Enterprise-Agent-specific handwritten page. App Platform selects `/enterprise-agent` as the current assistant route on top of the generic Eidos shell.

## 2. Enterprise Agent configuration

Enterprise Agent itself has **zero ordinary user configuration**.

It does not ask the user to configure:

- OpenAI/model vendor;
- model id;
- API URL;
- tools;
- enterprise id;
- user identity;
- application catalog.

Those are resolved from platform contracts:

```text
LLM      ← llm.inference Provider
Identity ← PlatformPrincipal / session
Scope    ← EnterpriseContext / PlatformScope
Tools    ← authorized App Platform tool registry
Locale   ← App Host locale context
```

The user's normal workflow is:

```text
install Enterprise Agent
→ open workspace
→ chat
```

If a required Provider is absent or not securely configured, Chat reports the missing platform dependency. The Agent does not grow a vendor-specific settings form.

## 3. Human-confirmed operation

Target operating model:

```text
Human intent
→ Enterprise Agent reasons
→ inspects data/configuration
→ proposes change / prepares plan
→ human confirms consequential operation
→ platform executes through public action/tool contract
→ result appears in chat + right workspace
```

Low-risk read-only operations may execute without extra confirmation.

## 4. Right workspace

Plugin Store, Ledger Configurator, Trading Lite and future Eidos Apps open in the right pane.

The Agent can later request workspace navigation through a public workspace/navigation tool, but route selection remains observable and auditable.

External websites may be shown in the same workspace browser when embeddable; they remain external content and never bypass App Platform permissions.

## 5. Mobile

Mobile keeps the Activity Bar available and shows one working surface at a time: Side Panel or Workspace. Selecting Agent/Apps opens the Side Panel; selecting an application/Plugin Store/Settings opens Workspace. Chat and workspace state are preserved while switching.

## 6. Immediate migration

1. extend Eidos with agent-workspace shell;
2. add generic Chat Experience;
3. convert Enterprise Agent page from form to Chat Experience;
4. configure App Platform `assistantRoute=/enterprise-agent`;
5. make left application navigation drive right workspace;
6. add responsive mobile pane switcher;
7. preserve standard App Host mode for other Eidos consumers.

## 7. Follow-up

After the shell is stable:

- add structured Agent proposals requiring human confirmation;
- add Agent-driven workspace navigation;
- expose Ledger Configurator operations through Agent tools;
- keep Configurator itself directly operable in right pane for inspection/override.


## 8. Workbench evolution

The fixed three-pane Agent Workspace is retained as a reusable Eidos shell, but EVO App Platform uses the newer Workbench:

- Activity Bar is narrow and persistent;
- Agent is one View Container, not permanently reserved screen real estate;
- clicking the current side Activity can hide the Side Panel;
- Side Panel width is draggable and persisted;
- Plugin Store and Settings are workspace targets;
- the main Workspace expands when the Side Panel is hidden.

Authority: `docs/architecture/EVO-WORKBENCH-v0.1.md`.
