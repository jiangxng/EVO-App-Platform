# LLM Context Contract

A fresh LLM must first determine:

1. whether the task belongs to App Manager, Catalog, an App, EVO, or Eidos;
2. which public contracts are authoritative;
3. manifest/version/dependency impact;
4. lifecycle safety and rollback implications;
5. certification required.

Default rules:

- Prefer existing App and public contract composition over creating new platform code.
- Do not solve an App requirement by modifying EVO Core or Eidos Core unless a genuine reusable capability gap is proven.
- Do not import private EVO/Eidos implementation.
- Do not let App Manager know app-specific business semantics.
- Record confirmed architectural decisions in repository artifacts.
