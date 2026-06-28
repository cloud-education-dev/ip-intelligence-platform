# Feature-by-Feature Implementation Plan

1. Domain engines: IPv4/IPv6 parser, CIDR math, subnetting, VLSM, supernetting.
2. Validation engine: overlap, invalid CIDR, invalid mask, duplicate network, reserved use, gateway conflict.
3. Local-first IPAM: projects, orgs, VPCs, networks, pools, devices, inventory, allocation lifecycle.
4. Visualization: React Flow topology, CIDR tree, heatmap, packet animation timeline.
5. AWS VPC designer: palette, canvas, AZ grouping, route tables, IGW/NAT/TGW/endpoints.
6. Simulators: routing LPM, stateful SG, stateless NACL, NAT/IGW packet flow.
7. Education mode: What/Why/How examples, AWS/Cisco/Linux mappings and interview prompts.
8. Exports: JSON/YAML/Markdown, SVG/PNG/PDF, Terraform, CloudFormation, CDK, Containerlab.
9. Integrations: optional Containerlab file generation and Linux namespace command recipes.
10. Production hardening: tests, CI, accessibility, docs, deployment.
