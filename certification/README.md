# Certification

Installation certification proves more than data correctness.

Planned baseline:

- AP-IC-00 Bare platform discovery
- AP-IC-01 Install first definition app
- AP-IC-02 Dependency planning
- AP-IC-03 Activate/deactivate visibility
- AP-IC-04 Upgrade
- AP-IC-05 Uninstall/reinstall
- AP-IC-06 External runtime extension
- AP-IC-07 Eidos App Host discovery


## CI separation

Certification is intentionally separate from ordinary plugin development.

- Platform PR: protocol/core tests only.
- Plugin PR: owning plugin tests only.
- Full portfolio: scheduled/manual/release Ecosystem Certification.
- Material Plugin Protocol changes: run Ecosystem Certification before release/acceptance.

The certification layer may become broader over time without making ordinary plugin feedback slower.
