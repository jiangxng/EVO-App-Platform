# Repository agent instructions — Human UI design gate

Existing project bootstrap/LLM authorities still apply. Do not replace or skip them.

**Every AI/LLM agent planning or modifying Human-facing UI must read and apply `.clinerules/03-human-ui-design-review.md` before designing or coding.** Also read the Eidos Human Experience Design Authority, Navigation & IA, Productive Design Language and Business Office Visual Language for the current task, plus mobile and accessible interaction rules when relevant.

Assess the Human task, minimal safe journey, navigation placement, existing color/tokens, visual hierarchy, cognitive load/recognition rather than recall, across-age usability, persisted context/recovery, permissions and testing. Do not invent a competing design system, force users to remember old selections, or turn deterministic actions into chat-only tasks.

For any GitHub PR modifying UI source/interaction, add or update a substantive `docs/ui-design-reviews/<scope>-<YYYYMMDD>.md` with the eight headings from the required checklist and at least one exact modified UI source file path. The UI design CI gate verifies the review's presence and structure. **CI does not prove Human acceptance.** Distinguish design evidence, code tests, deployment and live user validation.

Keep changes scoped to the owning repository/module; do not override concurrent agents' files or change platform/Agent contracts to satisfy visual appearance.
