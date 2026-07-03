# Systemd Test Suite (Full)

This package contains:

- `valid/` — 6 valid service files mirroring your deployment templates
- `broken/` — 20 intentionally broken service files to test validators

Each broken file name describes the defect. Use with your file-mode checker, e.g.:

```bash
./check-unit-files.sh -q systemd_test_suite_full/valid/*.service
./check-unit-files.sh -q systemd_test_suite_full/broken/*.service
```
