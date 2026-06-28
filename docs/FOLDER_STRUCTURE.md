# Complete Folder Structure

```text
ip-intelligence-platform/
├─ src/
│  ├─ domain/              # Pure business rules: IP, CIDR, subnet, AWS, routing, firewall
│  ├─ application/         # Use cases, stores, exporters, undo/redo, AI adapter boundary
│  ├─ presentation/        # React screens, modules, components, styles
│  └─ test/                # Test setup
├─ docs/                   # Architecture, schema, API design, wireframes, roadmap, diagrams
├─ deploy/                 # Docker, nginx, kubernetes manifests
├─ .github/workflows/      # CI/CD
└─ README.md
```
