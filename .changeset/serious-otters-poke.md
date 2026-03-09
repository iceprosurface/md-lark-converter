---
'@md-lark-converter/core': patch
'@md-lark-converter/cli': patch
---

Harden package publishing by validating the packed tarballs and republish the workspace packages together so the CLI no longer ships with broken internal dependency metadata.
