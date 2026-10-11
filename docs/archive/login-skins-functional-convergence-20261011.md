# Login skins — functional retirement of six legacy branches (2026-10-11)

Latest canonical login in `manager/login-page.ts` already renders independently selectable standard/demo skins, carries the user-approved `#d2eaff` TUGE demo scene, references installed local PNG artwork, and applies revision query keys. Existing `tests/app-host/login-page.test.mjs` tests end-to-end visual markup and dist binary emission. Existing current `main` implementation is retained byte-for-byte.

Legacy features from six branches were compared with main. The reference drafts introduced no capability worth reverting modern Eidos/auth logic. Their intermediate split .b64 staging files are not live assets; they remain reachable through immutable parent commit histories. The real `tuge-login-background-final.png` Git blob is identical between current main and `improve/login-assets-real-binary-v01`.

Additional protocol coverage protects standard/demo separation, revision URL encoding, and PNG binary integrity. Current Google login, unconfigured future methods, logout, authentication and state files are not modified.

| Original branch | Source head |
|---|---|
| `fix/login-assets-binary-v02` | `4cd090be941219f95a26288ce8298dad4dcf77a0` |
| `fix/login-assets-valid-binary-v01` | `844583709268ef09f0ed9282ebfe10dd415495b3` |
| `improve/login-assets-cache-revision-v01` | `771e194f3b6c706e43fdaeb750d15f05317a8047` |
| `improve/login-assets-real-binary-v01` | `9a1a14d9bb074bf56ff940217261295b1ea1bba9` |
| `improve/login-final-reference-v03` | `8c2f70962bd231b6c749b00bfaf25986de8b3dcc` |
| `improve/login-final-tuge-v03` | `50e3768acede4060c02c90d029e6fa256b3c803c` |

Do not re-merge outdated `manager/server.ts`, CSS or Eidos runtime from the legacy branches; only current main is the product authority. All six source commits are additional parents of this convergence commit for safe branch retirement.
