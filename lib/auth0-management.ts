// lib/auth0-management.ts
import { ManagementClient } from "auth0"

type JsonRecord = Record<string, any>

// type User = {
//     user_id: string;
//     email: string;
//     name?: string;
//     created_at: string;
//     updated_at: string;
//     user_metadata?: JsonRecord;
//     app_metadata?: JsonRecord;
// }

// type Organization = {
//     id: string;
//     name: string;
//     display_name?: string;
//     branding?: {
//         logo_url?: string;
//         colors?: { primary?: string; page_background?: string };
//     };
//     metadata?: JsonRecord;
//     created_at?: string;
//     updated_at?: string;
// }

export interface Auth0UserSummary {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
  user_metadata?: JsonRecord
  app_metadata?: JsonRecord
}

export interface Auth0OrganizationSummary {
  id: string
  name: string
  display_name?: string
  branding?: {
    logo_url?: string
    colors?: { primary?: string; page_background?: string }
  }
  metadata?: JsonRecord
  created_at?: string
  updated_at?: string
}

export interface Auth0ClientSummary {
  client_id: string
  name: string
  app_type?: string
  token_endpoint_auth_method?: string
  grant_types?: string[]
  response_types?: string[]
  callbacks?: string[]
  allowed_logout_urls?: string[]
  web_origins?: string[]
  metadata?: JsonRecord
  created_at?: string
  updated_at?: string
}

function toUserSummary(u: any): Auth0UserSummary {
  return {
    id: u.user_id as string,
    email: u.email as string,
    name: (u.name as string) ?? undefined,
    created_at: u.created_at as string,
    updated_at: u.updated_at as string,
    user_metadata: (u.user_metadata as JsonRecord) ?? undefined,
    app_metadata: (u.app_metadata as JsonRecord) ?? undefined,
  }
}

function toOrgSummary(o: any): Auth0OrganizationSummary {
  return {
    id: o.id,
    name: o.name,
    display_name: o.display_name,
    branding: o.branding,
    metadata: o.metadata,
    created_at: o.created_at,
    updated_at: o.updated_at,
  }
}

export class Auth0ManagementAPI {
  private mgmt: ManagementClient

  constructor() {
    const domain = process.env.AUTH0_MGMT_DOMAIN
    if (!domain) throw new Error("Missing AUTH0_MGMT_DOMAIN")
    if (!process.env.AUTH0_MGMT_CLIENT_ID || !process.env.AUTH0_MGMT_CLIENT_SECRET) {
      throw new Error("Missing AUTH0_MGMT_CLIENT_ID or AUTH0_MGMT_CLIENT_SECRET")
    }

    this.mgmt = new ManagementClient({
      domain,
      clientId: process.env.AUTH0_MGMT_CLIENT_ID!,
      clientSecret: process.env.AUTH0_MGMT_CLIENT_SECRET!,
      // scope: [
      //     // Users
      //     'read:users',
      //     'create:users',
      //     'update:users',
      //     'delete:users',
      //     'read:users_app_metadata',
      //     'update:users_app_metadata',
      //     // Orgs
      //     'read:organizations',
      //     'create:organizations',
      //     'update:organizations',
      //     'delete:organizations',
      //     'create:organization_members',
      //     'delete:organization_members',
      // ].join(' '),
    })
  }

  // USERS

  async createUser(params: {
    email: string
    name?: string
    password?: string // optional; if omitted, invite flows may be needed
    user_metadata?: JsonRecord
    app_metadata?: JsonRecord
    connection?: string // DB connection name; defaults to env
  }): Promise<Auth0UserSummary> {
    const connection = params.connection || process.env.AUTH0_DB_CONNECTION
    console.log("🔍 Connection:", connection)
    if (!connection)
      throw new Error("Missing DB connection. Set AUTH0_DB_CONNECTION or pass connection param.")

    const { data: u } = await this.mgmt.users.create({
      connection,
      email: params.email,
      name: params.name,
      password: params.password,
      user_metadata: params.user_metadata,
      app_metadata: params.app_metadata,
      email_verified: false,
      verify_email: true,
    })
    return toUserSummary(u)
  }

  async getUser(userId: string): Promise<Auth0UserSummary | null> {
    try {
      const { data: u } = await this.mgmt.users.get({ id: userId })
      return toUserSummary(u)
    } catch {
      return null
    }
  }

  async listUsers(options?: {
    q?: string
    page?: number
    perPage?: number
  }): Promise<Auth0UserSummary[]> {
    const res = await this.mgmt.users.getAll({
      q: options?.q,
      page: options?.page,
      per_page: options?.perPage,
      search_engine: "v3",
    })
    return res.data.map(toUserSummary)
  }

  async updateUser(
    userId: string,
    updates: {
      email?: string
      name?: string
      password?: string
      user_metadata?: JsonRecord
      app_metadata?: JsonRecord
    }
  ): Promise<Auth0UserSummary> {
    const { data: u } = await this.mgmt.users.update(
      { id: userId },
      {
        email: updates.email,
        name: updates.name,
        password: updates.password,
        user_metadata: updates.user_metadata,
        app_metadata: updates.app_metadata,
      }
    )
    return toUserSummary(u)
  }

  async deleteUser(userId: string): Promise<void> {
    await this.mgmt.users.delete({ id: userId })
  }

  // ORGANIZATIONS

  async createOrganization(params: {
    name: string // must be unique slug
    display_name?: string
    branding?: { logo_url?: string; colors?: { primary?: string; page_background?: string } }
    metadata?: JsonRecord
  }): Promise<Auth0OrganizationSummary> {
    const { data: o } = await this.mgmt.organizations.create({
      name: params.name,
      display_name: params.display_name,
      branding: params.branding,
      metadata: params.metadata,
    } as any)
    return toOrgSummary(o)
  }

  async getOrganization(orgIdOrName: string): Promise<Auth0OrganizationSummary | null> {
    try {
      const { data: o } = await this.mgmt.organizations.get({ id: orgIdOrName } as any)
      return toOrgSummary(o)
    } catch {
      return null
    }
  }

  async listOrganizations(options?: {
    page?: number
    perPage?: number
  }): Promise<Auth0OrganizationSummary[]> {
    const res = await this.mgmt.organizations.getAll({
      page: options?.page,
      per_page: options?.perPage,
    } as any)
    return res.data.organizations.map(toOrgSummary)
  }

  async updateOrganization(
    orgId: string,
    updates: {
      name?: string // org slug; changing has implications
      display_name?: string
      branding?: { logo_url?: string; colors?: { primary?: string; page_background?: string } }
      metadata?: JsonRecord
    }
  ): Promise<Auth0OrganizationSummary> {
    const { data: o } = await this.mgmt.organizations.update(
      { id: orgId } as any,
      {
        name: updates.name,
        display_name: updates.display_name,
        branding: updates.branding,
        metadata: updates.metadata,
      } as any
    )
    return toOrgSummary(o)
  }

  async deleteOrganization(orgId: string): Promise<void> {
    await this.mgmt.organizations.delete({ id: orgId } as any)
  }

  // CLIENTS

  async createClient(params: {
    name: string
    app_type: "native" | "spa" | "regular_web" | "non_interactive"
    grant_types?: string[]
    response_types?: string[]
    callbacks?: string[]
    allowed_logout_urls?: string[]
    web_origins?: string[]
    metadata?: JsonRecord
  }): Promise<Auth0ClientSummary> {
    const { data: c } = await this.mgmt.clients.create({
      name: params.name,
      app_type: params.app_type,
      grant_types: params.grant_types || ["authorization_code", "refresh_token"],
      response_types: params.response_types || ["code"],
      callbacks: params.callbacks || [],
      allowed_logout_urls: params.allowed_logout_urls || [],
      web_origins: params.web_origins || [],
      metadata: params.metadata,
      token_endpoint_auth_method: "none", // For public clients
    })
    return {
      client_id: c.client_id!,
      name: c.name!,
      app_type: c.app_type,
      token_endpoint_auth_method: c.token_endpoint_auth_method,
      grant_types: c.grant_types,
      response_types: c.response_types,
      callbacks: c.callbacks,
      allowed_logout_urls: c.allowed_logout_urls,
      web_origins: c.web_origins,
      metadata: c.metadata,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }
  }

  async getClient(clientId: string): Promise<Auth0ClientSummary | null> {
    try {
      const { data: c } = await this.mgmt.clients.get({ client_id: clientId })
      return {
        client_id: c.client_id!,
        name: c.name!,
        app_type: c.app_type,
        token_endpoint_auth_method: c.token_endpoint_auth_method,
        grant_types: c.grant_types,
        response_types: c.response_types,
        callbacks: c.callbacks,
        allowed_logout_urls: c.allowed_logout_urls,
        web_origins: c.web_origins,
        metadata: c.metadata,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }
    } catch {
      return null
    }
  }

  async updateClient(
    clientId: string,
    updates: {
      name?: string
      app_type?: "native" | "spa" | "regular_web" | "non_interactive"
      grant_types?: string[]
      response_types?: string[]
      callbacks?: string[]
      allowed_logout_urls?: string[]
      web_origins?: string[]
      metadata?: JsonRecord
    }
  ): Promise<Auth0ClientSummary> {
    const { data: c } = await this.mgmt.clients.update(
      { client_id: clientId },
      {
        name: updates.name,
        app_type: updates.app_type,
        grant_types: updates.grant_types,
        response_types: updates.response_types,
        callbacks: updates.callbacks,
        allowed_logout_urls: updates.allowed_logout_urls,
        web_origins: updates.web_origins,
        metadata: updates.metadata,
      }
    )
    return {
      client_id: c.client_id!,
      name: c.name!,
      app_type: c.app_type,
      token_endpoint_auth_method: c.token_endpoint_auth_method,
      grant_types: c.grant_types,
      response_types: c.response_types,
      callbacks: c.callbacks,
      allowed_logout_urls: c.allowed_logout_urls,
      web_origins: c.web_origins,
      metadata: c.metadata,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }
  }

  async deleteClient(clientId: string): Promise<void> {
    await this.mgmt.clients.delete({ client_id: clientId })
  }

  // MEMBERSHIP HELPERS (optional)

  async inviteUserToOrganization(
    orgId: string,
    params: {
      email: string
      inviter_name?: string
      app_metadata?: JsonRecord
    }
  ): Promise<void> {
    await this.createOrganizationInvitation(orgId, params)
  }

  async addUserToOrganization(orgId: string, userId: string): Promise<void> {
    console.log("in auth0-management.ts: Adding user to organization:", orgId, userId)
    await this.mgmt.organizations.addMembers({ id: orgId } as any, { members: [userId] } as any)
  }

  async removeUserFromOrganization(orgId: string, userId: string): Promise<void> {
    await this.mgmt.organizations.deleteMembers(
      { id: orgId } as any,
      { members: [{ user_id: userId }] } as any
    )
  }

  async listOrganizationMembers(
    orgId: string,
    options?: { page?: number; perPage?: number }
  ): Promise<Auth0UserSummary[]> {
    const res = await this.mgmt.organizations.getMembers(
      { id: orgId } as any,
      {
        page: options?.page,
        per_page: options?.perPage,
      } as any
    )
    const members: any[] = Array.isArray((res as any).data)
      ? (res as any).data
      : ((res as any).data?.members ?? [])
    return members.map((u: any) => toUserSummary(u))
  }

  // Invitations
  async createOrganizationInvitation(
    orgId: string,
    params: {
      email: string
      inviter_name?: string
      app_metadata?: JsonRecord
    }
  ): Promise<any> {
    const body: any = {
      invitee: { email: params.email },
      inviter: params.inviter_name ? { name: params.inviter_name } : undefined,
      client_id: process.env.AUTH0_CLIENT_ID,
      connection_id: process.env.AUTH0_DB_CONNECTION_ID || "Username-Password-Authentication",
      app_metadata: params.app_metadata,
      send_invitation_email: true,
    }
    const { data } = await this.mgmt.organizations.createInvitation({ id: orgId } as any, body)
    return data
  }

  // (Optional) Aliases to ease future swaps from Okta-style names
  // async createGroup(name: string, description?: string, metadata?: JsonRecord): Promise<Auth0OrganizationSummary> {
  //     return this.createOrganization({ name, display_name: description, metadata });
  // }
  // async updateGroup(groupId: string, name: string, description?: string): Promise<void> {
  //     await this.updateOrganization(groupId, { name, display_name: description });
  // }
  // async deleteOrganizationLegacy(groupId: string): Promise<void> {
  //     await this.deleteOrganization(groupId);
  // }

  // UTILITY METHODS

  /**
   * Generate a secure temporary password for new users
   */
  generateTemporaryPassword(): string {
    const length = 16
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  /**
   * Send password reset email to user
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    const connection = process.env.AUTH0_DB_CONNECTION || "Username-Password-Authentication"
    await this.mgmt.tickets.createPasswordChange({
      user_id: email, // Auth0 accepts email for password reset
      connection_id: connection,
      result_url: `${process.env.NEXT_PUBLIC_APP_URL}/login?message=password-reset-sent`,
    })
  }

  /**
   * Complete user setup process: create user, add to organization, and send credentials
   */
  async setupNewUser(params: {
    email: string
    name: string
    organizationId: string
    role: string
    partnerId: string
    metadata?: Record<string, any>
  }): Promise<{
    auth0UserId: string
    temporaryPassword: string
    user: Auth0UserSummary
  }> {
    try {
      // 1. Create user in Auth0
      const temporaryPassword = this.generateTemporaryPassword()
      const user = await this.createUser({
        email: params.email,
        name: params.name,
        password: temporaryPassword,
        user_metadata: {
          partner_id: params.partnerId,
          role: params.role,
          setup_date: new Date().toISOString(),
          ...params.metadata,
        },
        app_metadata: {
          partner_id: params.partnerId,
          role: params.role,
          organization_id: params.organizationId,
        },
      })

      // 2. Add user to organization
      await this.addUserToOrganization(params.organizationId, user.id)

      // 3. Send password reset email (more secure than temporary password)
      await this.sendPasswordResetEmail(params.email)

      return {
        auth0UserId: user.id,
        temporaryPassword, // Return for logging/debugging
        user,
      }
    } catch (error) {
      console.error("Error setting up new user:", error)
      throw new Error(
        `Failed to setup new user: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }
}

export const auth0ManagementAPI = new Auth0ManagementAPI()
