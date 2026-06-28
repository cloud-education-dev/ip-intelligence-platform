# Database Schema

The MVP is no-backend and uses browser persistence. This schema is the canonical model for IndexedDB/PostgreSQL if a backend is later added.

```mermaid
erDiagram
  ORGANIZATION ||--o{ PROJECT : owns
  PROJECT ||--o{ VPC : contains
  VPC ||--o{ NETWORK : contains
  NETWORK ||--o{ SUBNET : contains
  SUBNET ||--o{ IP_ALLOCATION : has
  DEVICE ||--o{ INTERFACE : has
  INTERFACE ||--o{ IP_ALLOCATION : uses

  ORGANIZATION { uuid id string name string slug timestamp created_at }
  PROJECT { uuid id uuid organization_id string name string environment json tags }
  VPC { uuid id uuid project_id string provider string region cidr name }
  NETWORK { uuid id uuid vpc_id string cidr string purpose }
  SUBNET { uuid id uuid network_id string cidr string az string tier string gateway_ip }
  IP_ALLOCATION { uuid id uuid subnet_id string ip string status string owner string reservation_reason }
  DEVICE { uuid id uuid project_id string name string type json metadata }
  INTERFACE { uuid id uuid device_id string name string mac string security_zone }
```

Statuses: `allocated`, `released`, `reserved`, `locked`.
