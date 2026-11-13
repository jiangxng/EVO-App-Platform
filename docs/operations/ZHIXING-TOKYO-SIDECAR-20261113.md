# Zhixing Tokyo sidecar release

User-authorized scope: publish the private `jiangxng/a-share-quant-workbench` application to the existing Tokyo host using tracking's established deployment channel. This is an independent single-operator application, not an EVO plugin or a milestone change.

Baseline: tracking's `tracking-tencent-deploy.yml` already uses `evo-tokyo-dev` pinned SSH secrets and `evo-deploy@43.167.252.197`. Remaining gap: Zhixing has no cloud deployment; its source is private, so tracking's anonymous HTTPS clone cannot be reused. No failed attempt in this delivery loop; the historical local SSH handshake failure is not retried.

Only this workflow and this note change in EVO. Existing EVO/tracking workflows, Compose services, databases, volumes, host auth and shared continuity state are not edited. The application repo owns its container, installer, data and tests. Public workflow logs never contain private source or credentials.

## Prepare then deploy

- A workflow-file push runs `prepare`, only checking server capacity and creating a dedicated source SSH key inside `/home/evo-deploy/zhixing`. Only its public key is emitted. The private half stays on the target server.
- Register that public key as a **read-only deploy key on a-share-quant-workbench only**. Do not copy the existing EVO deployment private key or grant organization-wide access.
- After the private application's exact commit passes tests, dispatch `mode=deploy` with its 40-character `source_sha`. Only main may run, and the existing protected environment/SSH host identity remains authoritative.
- The server validates GitHub host keys via GitHub's HTTPS metadata endpoint, checks out the exact private source commit, and invokes that commit's installer. No private code is copied into this public repository.
- The installer uses independent `/home/evo-deploy/zhixing`, Docker `zhixing` Compose project, `zhixing_data` volume and `zhixing-app` network alias; no extra public port. Caddy exposes `zhixing.43.167.252.197.sslip.io`, reusing the existing EVO operator credential behind HTTPS. A separate proxy credential also protects direct container API access.
- Local personal stock/research/ebook data are not uploaded. Cloud data starts separately. The app's health endpoint reports revision and storage mode only; state/export/library APIs require authentication.

Smallest gate: pinned SSH/resource preflight, source deploy-key admission, exact app tests/image build, app readiness, HTTPS revision match, anonymous 401 on private routes, then unchanged EVO/tracking/scraper health. A failure stops release and preserves data; app installer restores the prior Caddy file and prior image when available. It does not claim to roll back schema changes or data writes.

Pivot: if pinned SSH/capacity fails, use that evidence rather than repeat local SSH or weaken host checking; if source access fails, inspect the single read-only repository key rather than exporting broad credentials. Two ineffective iterations require reassessment. Human browser acceptance remains separate from workflow success.
