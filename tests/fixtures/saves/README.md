# Expedition fixtures

`fresh.json`, `mid.json`, and `late.json` are the raw strings `save()` wrote to `farwake_founders_alpha03_v1` on this build. `manifest.json` is a summary. Regenerate from the repo root with `node tests/generate-save-fixtures.mjs` after a gameplay change that should refresh the blobs. The load test compares the files. It does not regenerate them.
