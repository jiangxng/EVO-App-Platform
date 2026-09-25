# Plugin CI template

This template is intentionally plugin-local. Replace the paths and test command with the owning plugin only.

```yaml
name: Plugin CI - <plugin-id>

on:
  push:
    branches: [main]
    paths:
      - "<plugin-path>/**"
      - "<plugin-test-path>/**"
  pull_request:
    paths:
      - "<plugin-path>/**"
      - "<plugin-test-path>/**"

concurrency:
  group: plugin-<plugin-id>-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install
      - run: npm run build
      - run: <plugin protocol conformance>
      - run: <plugin-only tests>
```

Do not add unrelated plugin paths to this workflow. Cross-plugin or ecosystem certification belongs to the separate certification workflow.
