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
