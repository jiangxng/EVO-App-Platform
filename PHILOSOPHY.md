# EVO App Platform Philosophy

1. **Applications grow the enterprise; Core remains stable.**
2. **Install by contract, not by private implementation dependency.**
3. **App Manager manages lifecycle, not business semantics.**
4. **Official and third-party apps obey the same manifest and lifecycle rules.**
5. **Backend capability belongs behind EVO public contracts; frontend experience belongs behind Eidos public contracts.**
6. **Prefer declarative package content over executable installers.**
7. **Install, upgrade, deactivate and uninstall must be observable, versioned and recoverable.**
8. **Repository documents and machine-readable contracts are authoritative; chat memory is not.**

9. **Business-readable, LLM-readable, LLM-engineered.** Normal package/app/plugin configuration must be understandable by business users and LLMs and operable by novice users without SQL or source-code changes. Human developers are not an assumed role; LLMs perform ordinary software engineering and extension work.
10. **One semantic truth.** Human-readable configuration may compile to machine contracts, but the platform must not maintain a separate hidden meaning for humans and machines.

Authority: `docs/architecture/HUMAN-LLM-OPERABILITY-v0.1.md`.

11. **Definitions are durable; editors are replaceable.** Enterprise Context is the headless authority for enterprise Business Definitions. Specialized designers remain peer plugins.
12. **Knowledge and definition are different assets.** Experience Compiler owns enterprise/industry knowledge and learning; Enterprise Context owns governed enterprise definitions.
13. **EOG aggregates; it does not absorb every domain.** EOG Core owns the enterprise graph/design/navigation surface. SOP, reporting and analysis capabilities may integrate with EOG without becoming its children.
14. **Platform is control plane; components form the data plane.** App Platform discovers, binds, authorizes and governs components; ordinary component data exchange should use stable direct interfaces after binding.
15. **Preserve before extraction.** Existing SOP/Observatory/analysis implementations are assets. Correcting ownership must not destroy working capability before the target plugin boundary exists.

