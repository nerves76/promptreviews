# Prisma Integration Guide

This guide shows how to integrate Prisma with your existing Supabase setup in the Prompt Reviews project.

## Overview

Prisma has been configured to work alongside your existing Supabase client, providing:
- **Type-safe database queries** with auto-completion
- **Single readable schema** showing all tables and relationships
- **Better developer experience** with generated TypeScript types
- **Compatibility with Supabase Auth and RLS**

## Setup Complete

✅ Prisma CLI and client installed
✅ Database schema pulled from Supabase (54 models)
✅ TypeScript types generated in `src/generated/prisma`
✅ Both `public` and `auth` schemas included

## Project Structure

```
prisma/
└── schema.prisma          # Generated schema with all 54 models

src/
└── generated/
    └── prisma/            # Generated Prisma client and types
        ├── index.js
        ├── index.d.ts
        └── ...

.env.local                 # Contains DATABASE_URL for Prisma
```

## Basic Usage

### 1. Create Prisma Client Instance

Create a new file for your Prisma client:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
```

### 2. Example Queries

```typescript
// src/examples/prisma-examples.ts
import prisma from '../lib/prisma'

// Get all accounts with their businesses
async function getAccountsWithBusinesses() {
  return await prisma.accounts.findMany({
    include: {
      businesses: true,
      account_users: {
        include: {
          users: {
            select: {
              email: true,
              created_at: true
            }
          }
        }
      }
    }
  })
}

// Get prompt pages for a specific account
async function getPromptPagesForAccount(accountId: string) {
  return await prisma.prompt_pages.findMany({
    where: {
      account_id: accountId,
      status: 'draft' // Type-safe enum values
    },
    include: {
      contacts: true,
      review_submissions: {
        take: 10,
        orderBy: {
          created_at: 'desc'
        }
      }
    }
  })
}

// Create a new contact with type safety
async function createContact(accountId: string, contactData: {
  first_name: string
  last_name?: string
  email?: string
  phone?: string
  category?: string
}) {
  return await prisma.contacts.create({
    data: {
      account_id: accountId,
      ...contactData,
      source: 'manual' // Type-safe enum
    }
  })
}

// Complex query with joins
async function getBusinessAnalytics(businessId: string) {
  return await prisma.businesses.findUnique({
    where: { id: businessId },
    include: {
      review_submissions: {
        where: {
          status: 'submitted'
        },
        select: {
          star_rating: true,
          platform: true,
          created_at: true
        }
      },
      _count: {
        select: {
          review_submissions: true
        }
      }
    }
  })
}
```

### 3. Working with Supabase RLS

Prisma respects Row Level Security when you use the correct user context:

```typescript
// For RLS-protected queries, you may need to use Supabase client
import { createClient } from '@supabase/supabase-js'

// Use Supabase for auth-dependent queries
const supabase = createClient(url, anonKey)

// Use Prisma for complex queries where RLS is handled by your API layer
export async function getAccountData(userId: string) {
  // This would need to be called from an API route with proper auth
  return await prisma.accounts.findFirst({
    where: {
      user_id: userId
    },
    include: {
      businesses: true,
      contacts: {
        take: 20
      }
    }
  })
}
```

## Integration Patterns

### 1. Gradual Migration

Start using Prisma for new queries while keeping existing Supabase queries:

```typescript
// Old way (keep for now)
const { data: contacts } = await supabase
  .from('contacts')
  .select('*')
  .eq('account_id', accountId)

// New way with Prisma
const contacts = await prisma.contacts.findMany({
  where: { account_id: accountId },
  include: {
    review_submissions: true
  }
})
```

### 2. API Route Integration

Best practice is to use Prisma in API routes where you have full database access:

```typescript
// pages/api/businesses/[id].ts
import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const business = await prisma.businesses.findUnique({
        where: { id: String(id) },
        include: {
          accounts: true,
          review_submissions: {
            where: {
              verified: true
            },
            orderBy: {
              created_at: 'desc'
            },
            take: 10
          }
        }
      })

      if (!business) {
        return res.status(404).json({ error: 'Business not found' })
      }

      res.json(business)
    } catch (error) {
      console.error('Database error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
```

### 3. Type Definitions

Prisma generates comprehensive types for all your models:

```typescript
import type { 
  accounts,
  businesses,
  prompt_pages,
  contacts,
  review_submissions,
  Prisma
} from '../generated/prisma'

// Use generated types
type AccountWithBusinesses = Prisma.accountsGetPayload<{
  include: {
    businesses: true
    account_users: {
      include: {
        users: true
      }
    }
  }
}>

type ContactCreateInput = Prisma.contactsCreateInput

// Type-safe where clauses
const whereClause: Prisma.contactsWhereInput = {
  account_id: accountId,
  email: {
    not: null
  },
  created_at: {
    gte: new Date('2024-01-01')
  }
}
```

## Best Practices

### 1. Connection Management

```typescript
// src/lib/prisma.ts - Singleton pattern for connection pooling
import { PrismaClient } from '../generated/prisma'

declare global {
  var __prisma: PrismaClient | undefined
}

const prisma = globalThis.__prisma || new PrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

export default prisma
```

### 2. Error Handling

```typescript
import { Prisma } from '../generated/prisma'

async function safeCreateContact(data: Prisma.contactsCreateInput) {
  try {
    return await prisma.contacts.create({ data })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('A contact with this email already exists')
      }
    }
    throw error
  }
}
```

### 3. Performance Optimization

```typescript
// Use select to fetch only needed fields
const lightweightContacts = await prisma.contacts.findMany({
  where: { account_id: accountId },
  select: {
    id: true,
    first_name: true,
    last_name: true,
    email: true,
    created_at: true
  }
})

// Use pagination for large datasets
const paginatedResults = await prisma.review_submissions.findMany({
  skip: page * pageSize,
  take: pageSize,
  where: { verified: true },
  orderBy: { created_at: 'desc' }
})
```

## Available Models

Your schema includes 54 models across both `auth` and `public` schemas:

### Core Business Models
- `accounts` - User accounts and subscription info
- `businesses` - Business profiles and settings
- `contacts` - Customer contact information
- `prompt_pages` - Review request pages
- `review_submissions` - Submitted reviews
- `widgets` - Embeddable review widgets

### Auth Models (Supabase)
- `users` - User authentication data
- `sessions` - User sessions
- `identities` - OAuth identities
- `mfa_factors` - Multi-factor authentication

### Additional Features
- `analytics_events` - Event tracking
- `google_business_profiles` - Google My Business integration
- `communication_records` - Email/SMS tracking
- `trial_reminder_logs` - Trial expiration reminders
- And 40+ more models...

## Schema Exploration

You can explore your schema using:

1. **Prisma Studio** (Visual database browser):
   ```bash
   npx prisma studio
   ```

2. **Generated schema file**: `prisma/schema.prisma`

3. **TypeScript types**: Auto-completion in your IDE

## Migration Workflow

When you make database changes:

1. Apply migrations via Supabase:
   ```bash
   supabase db push
   ```

2. Update Prisma schema:
   ```bash
   npx prisma db pull
   ```

3. Regenerate client:
   ```bash
   npx prisma generate
   ```

## Next Steps

1. **Start with read-only queries** to get familiar with Prisma syntax
2. **Use Prisma in API routes** for complex business logic
3. **Keep Supabase client** for real-time subscriptions and auth
4. **Gradually migrate** existing queries to Prisma for better type safety
5. **Explore Prisma Studio** for visual database exploration

## Support

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma with Supabase Guide](https://supabase.com/docs/guides/integrations/prisma)
- Generated types: `src/generated/prisma/index.d.ts`

---

**Note**: Prisma is configured to complement your existing Supabase setup, not replace it. Use both tools for their respective strengths.