# API Design

No backend is required. These contracts define the internal application API and optional future REST/GraphQL boundary.

## REST Resources

- `GET /projects`
- `POST /projects`
- `GET /projects/{id}/vpcs`
- `POST /vpcs/{id}/validate`
- `POST /cidr/calculate`
- `POST /subnet/vlsm`
- `POST /route/lookup`
- `POST /security/evaluate`

## GraphQL Sketch

```graphql
type Project { id: ID!, name: String!, vpcs: [Vpc!]!, hosts: [Host!]! }
type Vpc { id: ID!, name: String!, cidr: String!, subnets: [Subnet!]! }
type Subnet { id: ID!, name: String!, cidr: String!, az: String, tier: String }
type Query { projects: [Project!]!, cidr(input: String!): CidrResult! }
type Mutation { validateVpc(input: VpcInput!): [ValidationIssue!]! }
```

## OpenAPI Stub

```yaml
openapi: 3.1.0
info: { title: IP Intelligence Platform API, version: 0.1.0 }
paths:
  /cidr/calculate:
    post:
      requestBody:
        content:
          application/json:
            schema: { type: object, properties: { cidr: { type: string } }, required: [cidr] }
      responses:
        '200': { description: CIDR calculation }
```
