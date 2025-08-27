# Partner Portal - Rideshare Platform

A comprehensive partner portal for managing rideshare technology and manufacturing partners, built with Next.js, Auth0 for authentication, Auth0 FGA for fine-grained authorization, and PostgreSQL.

## ⚠️ Disclaimer

This project is **not production-ready** and is provided for **demonstration, educational and experimental purposes only**.  
It comes with **no warranty of any kind**, either express or implied. Use it **at your own risk**.

The authors and contributors are **not liable for any damages or losses** arising from the use of this code.  
You are solely responsible for evaluating its fitness for your intended use, and for ensuring it meets all relevant legal, security, and quality standards before deploying it in any production environment.

## 🚀 Features

### Authentication & Authorization

- **Auth0 Integration**: Secure authentication with Universal Login and social login support
- **Auth0 FGA**: Fine-grained authorization with relationship-based access control
- **Role-based Access**: Different permissions for partner admins, users, and system admins

### Partner Management

- **Technology Partners**: Create and manage client applications (web, mobile, M2M)
- **Manufacturing Partners**: Manage documents and manufacturing capabilities
- **Fleet Maintenance Partners**: Access to rideshare map and fleet operations
- **User Management**: Invite and manage team members within partner organizations

### Dashboard & Analytics

- **Partner Dashboard**: Overview with stats and quick actions
- **Client Management**: Full CRUD operations for client applications
- **Document Management**: Complete document lifecycle management
- **Metro Area Management**: Geographic access control for rideshare operations
- **Audit Logging**: Track all system activities

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **Authentication**: Auth0 Universal Login
- **Authorization**: Auth0 FGA (Fine-Grained Authorization)
- **Database**: PostgreSQL with Prisma ORM
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Notifications**: React Hot Toast
- **Maps**: Leaflet for rideshare visualization
- **Testing**: Cypress for E2E testing

## 📋 Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Auth0 account** with Universal Login configured
- **Auth0 FGA account** for authorization
- **PostgreSQL database** (local or cloud)
- **Git** for version control

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repository-url>
cd partner-portal-rideshare
npm install
```

### 2. Environment Setup

Copy the environment example file and configure your variables:

```bash
cp env.example .env.local
```

Update `.env.local` with your credentials:

```env
# Auth0 Configuration
AUTH0_SECRET='your-auth0-secret'
AUTH0_SCOPE='openid profile email'
AUTH0_AUDIENCE='your-api-audience'

AUTH0_DOMAIN='your-tenant.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'

# Auth0 Management API
AUTH0_MGMT_API_DOMAIN='your-tenant.auth0.com'
AUTH0_MGMT_CLIENT_ID='your-mgmt-client-id'
AUTH0_MGMT_CLIENT_SECRET='your-mgmt-client-secret'

# FGA Configuration
FGA_API_URL='https://api.fga.dev'
FGA_STORE_ID='your-fga-store-id'
FGA_AUTHORIZATION_MODEL_ID='your-fga-model-id'
FGA_API_TOKEN_ISSUER='auth.fga.dev'
FGA_API_AUDIENCE='https://api.openfga.example/'
FGA_CLIENT_ID='your-fga-client-id'
FGA_CLIENT_SECRET='your-fga-client-secret'

# Database
DATABASE_URL='postgresql://username:password@host:port/database'

# API Configuration
NEXT_PUBLIC_API_BASE_URL='http://localhost:3000/api'

# Application Configuration
NEXT_PUBLIC_APP_NAME='Partner Portal'
NEXT_PUBLIC_APP_DESCRIPTION='Rideshare Platform Partner Portal'

# Development Configuration
NEXT_PUBLIC_STRICT_MODE='true'
```

### 3. Database Setup

The application uses PostgreSQL with Prisma ORM. The schema includes:

#### Core Tables
- `partners` - Partner organizations (technology, manufacturing, fleet maintenance)
- `users` - User metadata linked to Auth0
- `partner_users` - User relationships within partners
- `client_ids` - Client applications for technology partners
- `documents` - Documents for manufacturing partners
- `metro_areas` - Geographic areas for rideshare operations
- `partner_metro_areas` - Partner access to metro areas
- `partner_manufacturing_capabilities` - Manufacturing partner capabilities
- `audit_logs` - System audit trail

#### Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view/edit data
npm run prisma:studio
```

### 4. Auth0 Configuration

1. **Create Auth0 Application**:
   - Go to Auth0 Dashboard → Applications → Create Application
   - Choose "Single Page Application" for Next.js
   - Configure callback URLs: `http://localhost:3000/api/auth/callback`
   - Configure logout URLs: `http://localhost:3000`

2. **Configure Auth0 Management API**:
   - Go to Auth0 Dashboard → Applications → APIs
   - Enable "Auth0 Management API"
   - Create a Machine-to-Machine application
   - Grant necessary scopes: `read:users`, `create:users`, `update:users`, `delete:users`

3. **Set up Organizations** (for partner management):
   - Go to Auth0 Dashboard → Organizations
   - Enable Organizations feature
   - Configure organization settings

### 5. Auth0 FGA Configuration

1. **Create FGA Store**:
   - Go to [Auth0 FGA Console](https://console.fga.dev)
   - Create a new store
   - Note your store ID

2. **Deploy Authorization Model**:
   - Use the model from `model.fga.yaml`
   - Deploy to your FGA store
   - Note your model ID

3. **Configure FGA API Access**:
   - Create API credentials in FGA console
   - Update environment variables with your credentials

### 6. Run the Application

```bash
# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
├── app/                    # Next.js 15 app directory
│   ├── api/               # API routes
│   │   ├── admin/         # Admin-only endpoints
│   │   ├── auth/          # Auth0 authentication
│   │   ├── clients/       # Client management API
│   │   ├── documents/     # Document management API
│   │   ├── metro-areas/   # Metro area management API
│   │   ├── partners/      # Partner management API
│   │   └── users/         # User management API
│   ├── dashboard/         # Dashboard pages
│   │   ├── clients/       # Client management UI
│   │   ├── documents/     # Document management UI
│   │   ├── partners/      # Partner management UI
│   │   ├── users/         # User management UI
│   │   └── rideshare-map/ # Rideshare visualization
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── lib/                   # Utility libraries
│   ├── auth0.ts           # Auth0 configuration
│   ├── fga.ts             # FGA client & helpers
│   ├── permission-helpers.ts # Permission optimization helpers
│   ├── prisma.ts          # Database connection
│   └── types.ts           # TypeScript definitions
├── prisma/                # Database schema & migrations
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── components/            # Reusable UI components
├── cypress/               # E2E testing
└── scripts/               # Utility scripts
```

## 🔐 Authorization Model

The application uses Auth0 FGA with the following model:

```yaml
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

type metro_area
  relations
    define can_admin: [user] or can_admin from parent or super_admin from platform
    define can_view: [user] or can_view from parent or super_admin from platform
    define parent: [partner]
    define platform: [platform]

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

## 🎯 User Roles

### Partner Roles
- **partner_admin**: Admin within a partner organization
- **partner_user**: Member within a partner organization

### System Roles
- **sys_admin**: Internal admin assigned to manage specific partners
- **sys_super_admin**: Internal admin with full system access

## 📊 API Endpoints

### Authentication
- `GET /api/auth/login` - Auth0 login
- `GET /api/auth/callback` - Auth0 callback
- `GET /api/auth/logout` - Auth0 logout

### Partners
- `GET /api/partners/me` - Get current partner info
- `GET /api/partners` - List partners (system admins only)
- `POST /api/partners` - Create partner (system admins only)
- `PUT /api/partners/:id` - Update partner
- `DELETE /api/partners/:id` - Delete partner

### Clients
- `GET /api/clients` - List clients for partner
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Users
- `GET /api/users` - List users (filtered by permissions)
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🎨 UI Components

The application uses a modern, responsive design with:

- **Tailwind CSS** for utility-first styling
- **Headless UI** for accessible components
- **Lucide React** for consistent iconography
- **React Hot Toast** for user notifications
- **Leaflet** for interactive maps
- **Responsive design** for all device sizes

## 🔧 Development

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run type-check       # Run TypeScript type checking

# Database scripts
npm run prisma:migrate   # Run database migrations
npm run prisma:generate  # Generate Prisma client
npm run prisma:studio    # Open Prisma Studio
npm run prisma:push      # Push schema changes to database

# Testing
npm run cypress:open     # Open Cypress test runner
npm run cypress:run      # Run Cypress tests headlessly
```

### Code Quality

- **TypeScript** for type safety
- **ESLint** for code quality and consistency
- **Prettier** for code formatting
- **Husky** for git hooks
- **Conventional commits** for version control

### Testing

- **Cypress** for end-to-end testing
- **TypeScript** compilation checking
- **ESLint** for code quality
- **Prettier** for formatting consistency

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker

```bash
# Build Docker image
docker build -t partner-portal .

# Run container
docker run -p 3000:3000 partner-portal
```

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🧪 Testing

### E2E Testing with Cypress

```bash
# Open Cypress test runner
npm run cypress:open

# Run tests headlessly
npm run cypress:run
```

Test files are located in `cypress/e2e/` and cover:
- Authentication flows
- Partner management
- User management
- Client management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run lint && npm run type-check`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the documentation in this README
- Open an issue on GitHub
- Contact the development team

## 🔄 Recent Changes

- **Auth0 Integration**: Replaced Okta with Auth0 Universal Login
- **FGA Optimization**: Implemented batch operations and permission caching
- **Partner Types**: Added manufacturing partner capabilities
- **Metro Areas**: Geographic access control for rideshare operations
- **Performance**: Optimized FGA API calls and frontend state management

---

Built with ❤️ for the rideshare and partner management community.
