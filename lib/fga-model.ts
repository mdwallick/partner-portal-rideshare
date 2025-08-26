// FGA Authorization Model for Partner Portal
// Based on the PRD requirements

export const FGA_AUTHORIZATION_MODEL = `
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

type metro_area
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
`

// Helper functions for working with the new FGA model
export const FGA_RELATIONS = {
  // Partner relations
  PARTNER_CAN_ADMIN: "can_admin",
  PARTNER_CAN_MANAGE_MEMBERS: "can_manage_members",
  PARTNER_CAN_VIEW: "can_view",

  // Client relations
  CLIENT_CAN_ADMIN: "can_admin",
  CLIENT_CAN_VIEW: "can_view",

  // Document relations
  DOCUMENT_CAN_ADMIN: "can_admin",
  DOCUMENT_CAN_VIEW: "can_view",

  // Metro area relations
  METRO_AREA_CAN_ADMIN: "can_admin",
  METRO_AREA_CAN_VIEW: "can_view",

  // Platform relations
  PLATFORM_CAN_MANAGE_ALL: "can_manage_all",
  PLATFORM_CAN_VIEW_ALL: "can_view_all",
  PLATFORM_MANAGE_SME_ADMINS: "manage_sme_admins",
  PLATFORM_SUPER_ADMIN: "super_admin",
} as const

export const FGA_TYPES = {
  USER: "user",
  PARTNER: "partner",
  CLIENT: "client",
  DOCUMENT: "document",
  METRO_AREA: "metro_area",
  PLATFORM: "platform",
} as const

// Helper function to create FGA object identifiers
export function createFgaObject(type: keyof typeof FGA_TYPES, id: string): string {
  return `${FGA_TYPES[type]}:${id}`
}

// Helper function to create FGA user identifier
export function createFgaUser(auth0UserId: string): string {
  return `user:${auth0UserId}`
}

// Helper function to create FGA partner identifier
export function createFgaPartner(partnerId: string): string {
  return `partner:${partnerId}`
}

// Helper function to create FGA client identifier
export function createFgaClient(clientId: string): string {
  return `client:${clientId}`
}

// Helper function to create FGA document identifier
export function createFgaDocument(documentId: string): string {
  return `document:${documentId}`
}

// Helper function to create FGA metro area identifier
export function createFgaMetroArea(metroAreaId: string): string {
  return `metro_area:${metroAreaId}`
}

// Helper function to create FGA platform identifier
export function createFgaPlatform(platformId: string = "default"): string {
  return `platform:${platformId}`
}
