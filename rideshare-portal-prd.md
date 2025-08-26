# Partner Portal – Product Requirements Document (PRD)

## Overview

**Product Name:** Partner Portal for a rideshare company\
**Purpose:**\
Enable secure access for external partners (technology partners and manufacturing partners) to manage their assets. Auth0 will be used as the identity provider and Auth0 FGA to model and manage relationships. Partners will be represented as Auth0 organizations. The application framework will use NextJS.

---

## 1. Roles (Auth0 + FGA)

| Role              | Description                                                         |
| ----------------- | ------------------------------------------------------------------- |
| `partner_admin`   | Admin within an partner's org                                       |
| `partner_user`    | Member within an partner's org                                      |
| `sys_admin`       | Internal admin assigned to manage specific partners                 |
| `sys_super_admin` | Internal admin who can view/edit everything and manage `sys_admins` |

---

## 2. Entities & Relationships (Auth0 FGA)

**Entities:**

- `partner:{partner_id}` (has attribute `type`: `technology` or `manufacturing`)
- `user:{user_id}`
- `client:{client_id}`
- `document:{document_id}`

**Relationships:**

- `partner` → owns many `clients` (only if `type = technology`)
- `partner` → owns many `documents` (only if `type = manufacturing`)
- `partner` → includes many `users`
- `partner` → managed by `sys_admin`

---

## 3. UI Views

### 3.0 Login Page

- Login page hosted by Auth0
- Supports SSO & social login

### 3.1 Partner Management (SME Admins and SME Super Admin)

- List all partners (`/dashboard/partners`)
  - Show name, type, logo (or default), creation date
  - Filter by partner type
- Create a new partner (`/dashboard/partners/new`):
  - Name (required)
  - Type (`technology` or `manufacturing`)
  - Returns `partner_id`
- Edit existing partner (`/dashboard/partners/:partner_id/edit`):
  - Update name
  - Add or update logo URL
- Assign/unassign `sys_admin` to a partner (`/dashboard/partners/:partner_id/admins`) (only for `sys_super_admin`)

### 3.2 Dashboard

- Partner Name, Type (`technology` or `manufacturing`) (`/dashboard`)
- Stats: Clients and documents (`/dashboard/stats`)
- Quick links: Add Client / Add Document, View Profile (`/dashboard/clients/new`, `/dashboard/documents/new`, `/dashboard/profile`)

### 3.3 Client Management (Technology partners only)

- List clients (`/dashboard/clients`):
  - Picture (if any; default image if none)
  - Name
  - Type (one of: native_mobile_android, native_mobile_ios, web, M2M)
  - Date of creation
- **Create** a client (`/dashboard/clients/new`):
  - Provide name (required)
  - Provide type (required)
  - Returns `client_id`
- **Edit** client metadata (`/dashboard/clients/:client_id/edit`):
  - Update name
  - Optionally add/update album picture URL
  - Optionally select type
- **Revoke** a client (`/dashboard/clients/:client_id/revoke`)

### 3.4 Document management (Manufacturing partners only)

- List documents (`/dashboard/documents`):
  - Name
  - Description
  - Date of creation
- **Create** a document (`/dashboard/documents/new`):
  - Provide name (required)
  - Provide description (optional)
  - Returns `document_id`
- **Edit** document metadata (`/dashboard/documents/:document_id/edit`):
  - Update name
  - Optionally add/update description
- **Delete** a document (`/dashboard/documents/:document_id/revoke`)

### 3.5 User Management (Partner Admins)

- List partner users (`/dashboard/users`) (email, role)
- Invite user to organization (`/dashboard/users/invite`)
- Remove user from organization (`/dashboard/users/:user_id/remove`)

### 3.6 Sys Admin View

- View only assigned partners (`/dashboard/admin/partners`)
- Create new partner by entering (`/dashboard/admin/partners/new`):
  - Partner name (required)
  - Type: `technology` or `manufacturing` (required)
  - Returns `partner_id` on creation
- Edit existing partner (`/dashboard/admin/partners/:partner_id/edit`):
  - Modify name
  - Optionally add or update logo URL
- List all assigned partners (`/dashboard/admin/partners`):
  - Show partner logo (default image if missing)
  - Name, type, creation date
  - Click-through to partner-specific management views

### 3.7 Sys Super Admin View

- Full access to all partners (`/dashboard/super-admin`), albums, songs, and users
- View and edit all data formerly accessible by platform staff (`/dashboard/super-admin/audit`) (audit logs, global listings)
- Add or remove `sme_admin` roles for users (`/dashboard/super-admin/manage-admins`)
- Manage partner assignments for `sme_admin` (`/dashboard/super-admin/assignments`)
- View system-wide audit logs and stats (`/dashboard/super-admin/stats`)

---

## 4. API Endpoints

### 4.1 Auth (via Auth0)

- `GET /login` → Auth0 Hosted Login
  - Redirect user to Auth0's hosted login page
  - Handle OAuth2/OIDC provider integrations
  - Await redirect back to configured callback URL

### 4.2 Partner

- `GET /api/partners/me`
  - Validate JWT access token via Auth0
  - Extract partner from token context
  - Look up partner metadata in DB
  - Return partner name, type, and user role

- `POST /api/partners/users` → Invite partner user
  - Validate JWT access token via Auth0
  - Validate inviter permissions via FGA (`partner_admin`)
  - Validate email and role input
  - Create Auth0 invitation or trigger invitation email
  - Create tuple in FGA linking user to partner

- `DELETE /api/partners/users/:user_id` → Remove partner user
  - Validate JWT access token via Auth0
  - Validate requester permissions via FGA
  - Delete user-partner tuple in FGA
  - (Optional) Deactivate user from Auth0 tenant

- `POST /api/partners` → Create partner (requires name & type, returns `partner_id`)
  - Validate JWT access token via Auth0
  - Validate role via FGA (`sme_admin` or `sme_super_admin`)
  - Validate payload: name and type
  - Insert partner in database
  - Generate and return new `partner_id`

- `PUT /api/partners/:partner_id` → Update name and/or logo URL
  - Validate JWT access token via Auth0
  - Validate edit rights via FGA
  - Update database fields accordingly

- `GET /api/partners` → List partners (includes name, type, logo URL if any, created_at)
  - Validate JWT access token via Auth0
  - Filter by `sme_admin` assignment or `sme_super_admin` via FGA
  - Filter by `sme_admin` assignment or `sme_super_admin`
  - Load and return metadata

### 4.3 Clients

- `GET /api/clients` → List all clients for a partner
  - Validate JWT access token via Auth0
  - Query DB for albums linked to that partner
  - Return client list with metadata

- `POST /api/client` → Registers a client
  - Validate JWT access token via Auth0
  - Validate partner permissions via FGA
  - Validate name input
  - Create client in DB
  - Link client to partner in FGA
  - Return `album_id`

- `PUT /api/clients/:client_id`
  - Validate JWT access token via Auth0
  - Validate edit permission via FGA
  - Allow updates to client name, type, and optional picture URL
  - Update DB fields accordingly

- `DELETE /api/clients/:client_id`
  - Validate JWT access token via Auth0
  - Validate revoke permission via FGA
  - Mark client as inactive or deleted

### 4.4 Documents

- `GET /api/documents`
  - Validate JWT access token via Auth0
  - Validate that user is an artist partner
  - Return document list with metadata

- `POST /api/documents`
  - Validate JWT access token via Auth0
  - Validate artist permissions via FGA
  - Validate input name, validate input description
  - Insert new document in database
  - Return `document_id`

- `PUT /api/documents/:document_id`
  - Validate JWT access token via Auth0
  - Validate document ownership via FGA
  - Update metadata fields in DB

- `DELETE /api/documents/:document_id`
  - Validate JWT access token via Auth0
  - Validate document permission via FGA
  - Soft delete document (mark as archived)

## 5. Auth0 FGA Authorization Model

```dsl
model
  schema 1.1

type user

type partner
  relations
    define can_admin: [user] or super_admin from parent
    define can_manage_members: [user] or can_admin or super_admin from parent
    define can_view: [user] or can_manage_members or super_admin from parent
    define parent: [platform]

type client
  relations
    define can_admin: [user] or can_admin from parent
    define can_view: [user] or can_view from parent
    define parent: [partner]

type document
  relations
    define can_admin: [user] or can_admin from parent
    define can_view: [user] or can_view from parent
    define parent: [partner]

type platform
  relations
    define can_manage_all: [user] or super_admin
    define can_view_all: [user] or super_admin
    define manage_sme_admins: [user] or super_admin
    define super_admin: [user]
```

This model defines:

- Users tied to partners as `admin`, `member`, `manager`, or `sys_admin`
- Partners own `clients` and `documentss`, enabling permission propagation
- A `platform` object for `sys_super_admin` to get universal access and manage `sys_admin` assignments
