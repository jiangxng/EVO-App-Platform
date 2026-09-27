# DeepSeek LLM Provider v0.1

**Status:** implementation candidate  
**Date:** 2026-09-27

## Purpose

Add DeepSeek as an ordinary installable `llm.inference` / `llm.tool-calling` Provider without changing Personal Agent vendor-neutral behavior.

## Provider identity

- Package: `deepseek-llm-provider`
- Provider: `deepseek.responses`
- Runtime binding: `runtime://deepseek.responses`
- Default model: `deepseek-flash`
- Default base URL: `https://api.deepseek.com`
- Secret: `deepseek-llm-provider/apiKey`

The default model follows the current DeepSeek Responses API documentation. The model field remains editable so the Provider can use other compatible official models such as `deepseek-v4-pro` without changing Personal Agent.

## API boundary

The runtime uses DeepSeek's OpenAI-compatible Responses API:

```text
POST {baseUrl}/responses
GET  {baseUrl}/models
```

The Provider maps the existing EVO `LlmInferenceProvider` contract to DeepSeek request/response fields.

Personal Agent remains unaware of DeepSeek-specific details.

## Tool calling

DeepSeek regular Responses API tool calling consumes the generic EVO JSON Schema directly.

P1.4X's OpenAI-specific strict-schema normalization is intentionally **not** reused here because it exists to satisfy OpenAI `strict: true` semantics. DeepSeek regular Responses API is kept provider-local and does not force its optional-field rules into the shared EVO contract.

Host tool execution remains authoritative; an LLM tool call does not itself authorize a write.

## Secrets and settings

The API Key is declared as an INSTALLATION Secret and is stored only through Host Secrets.

Eidos Settings owns:

- model;
- base URL;
- API Key write/replace/remove;
- API Key configured status;
- bootstrap administrator authorization.

The UI ships localized copy for:

- en;
- zh-CN;
- ja;
- zh-TW.

Saved API Key plaintext is never returned to the browser.

## Runtime lifecycle

The Host:

1. resolves `deepseek-llm-provider/apiKey` from Host Secrets;
2. supports `DEEPSEEK_API_KEY` only as a compatibility migration/fallback;
3. resolves model from Provider Settings, then `DEEPSEEK_MODEL`, then `deepseek-flash`;
4. resolves base URL from Provider Settings, then `DEEPSEEK_BASE_URL`, then `https://api.deepseek.com`;
5. registers/replaces `deepseek.responses`;
6. registers a `/models` health probe;
7. removes the runtime when no usable credential exists.

## Multiple LLM Providers

Installing/configuring both OpenAI and DeepSeek does not create a default winner.

Existing Provider resolution rules remain authoritative:

```text
multiple usable llm.inference candidates
→ PROVIDER_RESOLUTION_AMBIGUOUS
→ Personal Agent Needs setup
→ Human chooses Provider
→ explicit Provider binding
```

No vendor is silently selected.

## Verification

Dedicated tests cover:

- lifecycle-managed installation and Host Secrets dependency;
- Responses API request mapping;
- function tool call mapping;
- response text and usage mapping;
- `/models` health validation;
- OpenAI + DeepSeek ambiguity;
- explicit binding to DeepSeek.
