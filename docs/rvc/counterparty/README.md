# Counterparty RVC Runs

This directory documents how to execute Counterparty Real-World Validation Corpus
(RVC) runs. Large source datasets stay outside Git.

## First source: GLEIF Golden Copy Level 1

Official download API:

`https://goldencopy.gleif.org/api/v2/golden-copies/publishes/lei2/latest.csv`

GLEIF publishes Golden Copy files in CSV/JSON/XML and provides LEI data under CC0.
The run manifest must still record the exact retrieval time/version used for evidence.

## Manifest

Create a JSON file outside the repository, or commit it together with the resulting
small report after the run.

Example:

```json
{
  "contractVersion": "0.1.0",
  "sourceId": "gleif-golden-copy-level1",
  "sourceUrl": "https://goldencopy.gleif.org/api/v2/golden-copies/publishes/lei2/latest.csv",
  "retrievedAt": "2026-10-08T18:00:00.000Z",
  "sourceVersion": "2026-10-08-1600 / LEI-CDF 3.1",
  "license": "CC0-1.0",
  "attributionRequirements": "None required by CC0; retain GLEIF provenance in EVO RVC evidence.",
  "redistributionConstraints": "None from CC0; original large dataset remains external to Git by EVO RVC policy.",
  "adapterVersion": "gleif-golden-copy-csv-v0.1",
  "sampling": {
    "method": "FIRST_N",
    "limit": 100000
  },
  "fieldMap": {
    "externalId": "LEI",
    "legalName": "Entity.LegalName",
    "countryOrRegion": "Entity.LegalAddress.Country",
    "jurisdiction": "Entity.LegalJurisdiction",
    "entityStatus": "Entity.EntityStatus",
    "registrationStatus": "Registration.RegistrationStatus"
  }
}
```

If a downloaded file digest is available, add `contentDigest` to the manifest.

## Run

```bash
npm run rvc:counterparty:gleif -- \
  --manifest /path/to/gleif.manifest.json \
  --input /path/to/gleif-golden-copy.csv \
  --report /path/to/counterparty-rvc-report.json
```

The report records provenance, validation-band size, shape failures, duplicate
identifier/name candidates, international-name pressure, missing country data,
source-status distributions and throughput.

A DESIGN report requires >=10k rows, INTEGRATION >=100k, and PERFORMANCE >=1M.
These bands are evidence scales, not semantic thresholds.
