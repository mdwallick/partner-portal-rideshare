#!/usr/bin/env tsx

import { fgaClient } from "../lib/fga"
import { FGA_AUTHORIZATION_MODEL } from "../lib/fga-model"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

async function deployFgaModel() {
  try {
    console.log("🚀 Deploying new FGA authorization model...")

    // Create the new authorization model
    const response = await fgaClient.writeAuthorizationModel({
      schema_version: "1.1",
      type_definitions: [
        {
          type: "user",
        },
        {
          type: "partner",
          relations: {
            can_admin: {
              union: {
                child: [
                  { _this: {} },
                  { computed_userset: { relation: "super_admin", object: { _this: {} } } },
                ],
              },
            },
            can_manage_members: {
              union: {
                child: [
                  { _this: {} },
                  { computed_userset: { relation: "can_admin", object: { _this: {} } } },
                  { computed_userset: { relation: "super_admin", object: { _this: {} } } },
                ],
              },
            },
            can_view: {
              union: {
                child: [
                  { _this: {} },
                  { computed_userset: { relation: "can_manage_members", object: { _this: {} } } },
                  { computed_userset: { relation: "super_admin", object: { _this: {} } } },
                ],
              },
            },
            parent: {
              computed_userset: {
                relation: "can_view",
                object: { _this: {} },
              },
            },
          },
        },
        {
          type: "client",
          relations: {
            can_admin: {
              union: {
                child: [
                  { _this: {} },
                  { computed_userset: { relation: "can_admin", object: { _this: {} } } },
                ],
              },
            },
            can_view: {
              union: {
                child: [
                  { _this: {} },
                  { computed_userset: { relation: "can_view", object: { _this: {} } } },
                ],
              },
            },
            parent: {
              computed_userset: {
                relation: "can_view",
                object: { _this: {} },
              },
            },
          },
        },
        {
          type: "document",
          relations: {
            can_admin: {
              union: {
                child: [
                  { _this: {} },
                  { computed_userset: { relation: "can_admin", object: { _this: {} } } },
                ],
              },
            },
            can_view: {
              union: {
                child: [
                  { _this: {} },
                  { computed_userset: { relation: "can_view", object: { _this: {} } } },
                ],
              },
            },
            parent: {
              computed_userset: {
                relation: "can_view",
                object: { _this: {} },
              },
            },
          },
        },
        {
          type: "platform",
          relations: {
            can_manage_all: {
              union: {
                child: [
                  { _this: {} },
                  { computed_userset: { relation: "super_admin", object: { _this: {} } } },
                ],
              },
            },
            can_view_all: {
              union: {
                child: [
                  { _this: {} },
                  { computed_userset: { relation: "super_admin", object: { _this: {} } } },
                ],
              },
            },
            manage_sme_admins: {
              union: {
                child: [
                  { _this: {} },
                  { computed_userset: { relation: "super_admin", object: { _this: {} } } },
                ],
              },
            },
            super_admin: {
              union: {
                child: [{ _this: {} }],
              },
            },
          },
        },
      ],
    })

    if (response.authorization_model_id) {
      console.log(`✅ FGA model deployed successfully!`)
      console.log(`📋 Model ID: ${response.authorization_model_id}`)
      console.log(
        `💡 Add this to your .env.local: FGA_AUTHORIZATION_MODEL_ID=${response.authorization_model_id}`
      )
    } else {
      throw new Error("No authorization model ID returned")
    }
  } catch (error) {
    console.error("❌ Failed to deploy FGA model:", error)
    process.exit(1)
  }
}

// Run the deployment
deployFgaModel()
