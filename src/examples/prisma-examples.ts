/**
 * Prisma Examples for Prompt Reviews
 * 
 * These examples show how to use Prisma for common database operations
 * in the Prompt Reviews application. Use these as a reference for
 * implementing type-safe database queries.
 */

import prisma, { type Prisma } from '../lib/prisma'

// ============================================================================
// ACCOUNT & BUSINESS OPERATIONS
// ============================================================================

/**
 * Get account with complete business information
 */
export async function getAccountWithBusinesses(accountId: string) {
  return await prisma.accounts.findUnique({
    where: { id: accountId },
    include: {
      businesses: {
        select: {
          id: true,
          name: true,
          logo_url: true,
          business_website: true,
          primary_color: true,
          secondary_color: true,
          created_at: true
        }
      },
      account_users: {
        include: {
          users: {
            select: {
              email: true,
              created_at: true
            }
          }
        }
      },
      _count: {
        select: {
          businesses: true,
          contacts: true,
          widgets: true
        }
      }
    }
  })
}

/**
 * Get business analytics with review statistics
 */
export async function getBusinessAnalytics(businessId: string) {
  const business = await prisma.businesses.findUnique({
    where: { id: businessId },
    include: {
      review_submissions: {
        where: {
          verified: true,
          star_rating: { not: null }
        },
        select: {
          star_rating: true,
          platform: true,
          created_at: true,
          verified_at: true
        },
        orderBy: { created_at: 'desc' },
        take: 100
      },
      _count: {
        select: {
          review_submissions: {
            where: { verified: true }
          }
        }
      }
    }
  })

  if (!business) return null

  // Calculate analytics
  const reviews = business.review_submissions
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.star_rating || 0), 0) / reviews.length
    : 0

  const platformStats = reviews.reduce((stats, review) => {
    const platform = review.platform || 'unknown'
    stats[platform] = (stats[platform] || 0) + 1
    return stats
  }, {} as Record<string, number>)

  return {
    ...business,
    analytics: {
      totalReviews: reviews.length,
      averageRating: Math.round(avgRating * 10) / 10,
      platformBreakdown: platformStats,
      recentReviews: reviews.slice(0, 10)
    }
  }
}

// ============================================================================
// PROMPT PAGES OPERATIONS
// ============================================================================

/**
 * Get prompt pages for account with filtering and pagination
 */
export async function getPromptPagesForAccount(
  accountId: string,
  options: {
    status?: Prisma.EnumPrompt_page_statusFilter
    type?: Prisma.EnumPrompt_page_typeFilter
    limit?: number
    offset?: number
  } = {}
) {
  const { status, type, limit = 20, offset = 0 } = options

  const where: Prisma.prompt_pagesWhereInput = {
    account_id: accountId,
    ...(status && { status }),
    ...(type && { type })
  }

  const [pages, total] = await Promise.all([
    prisma.prompt_pages.findMany({
      where,
      include: {
        contacts: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        review_submissions: {
          where: { status: 'submitted' },
          select: {
            id: true,
            star_rating: true,
            platform: true,
            created_at: true
          },
          orderBy: { created_at: 'desc' },
          take: 5
        },
        _count: {
          select: {
            review_submissions: {
              where: { status: 'submitted' }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.prompt_pages.count({ where })
  ])

  return {
    pages,
    total,
    hasMore: offset + pages.length < total
  }
}

/**
 * Create a new prompt page with validation
 */
export async function createPromptPage(
  accountId: string,
  data: {
    type: 'service' | 'product' | 'photo' | 'video' | 'event' | 'employee'
    name?: string
    client_name?: string
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    service_name?: string
    service_description?: string
    // Add other fields as needed
  }
) {
  // Generate unique slug
  const baseSlug = data.name || data.client_name || 'prompt-page'
  const slug = await generateUniqueSlug(baseSlug)

  return await prisma.prompt_pages.create({
    data: {
      account_id: accountId,
      slug,
      status: 'draft',
      campaign_type: 'individual',
      visibility: 'individual',
      ...data
    },
    include: {
      contacts: true
    }
  })
}

/**
 * Generate unique slug for prompt page
 */
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  const normalizedSlug = baseSlug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  let slug = normalizedSlug
  let counter = 1

  while (true) {
    const existing = await prisma.prompt_pages.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!existing) {
      return slug
    }

    slug = `${normalizedSlug}-${counter}`
    counter++
  }
}

// ============================================================================
// CONTACTS OPERATIONS
// ============================================================================

/**
 * Get contacts with search and filtering
 */
export async function getContacts(
  accountId: string,
  options: {
    search?: string
    category?: string
    source?: string
    verified?: boolean
    limit?: number
    offset?: number
  } = {}
) {
  const { search, category, source, verified, limit = 50, offset = 0 } = options

  const where: Prisma.contactsWhereInput = {
    account_id: accountId,
    ...(category && { category }),
    ...(source && { source }),
    ...(typeof verified === 'boolean' && {
      review_verification_status: verified ? 'verified' : 'unknown'
    }),
    ...(search && {
      OR: [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { business_name: { contains: search, mode: 'insensitive' } }
      ]
    })
  }

  const [contacts, total] = await Promise.all([
    prisma.contacts.findMany({
      where,
      include: {
        review_submissions_review_submissions_contact_idTocontacts: {
          select: {
            id: true,
            platform: true,
            star_rating: true,
            verified: true,
            created_at: true
          },
          orderBy: { created_at: 'desc' },
          take: 3
        },
        _count: {
          select: {
            review_submissions_review_submissions_contact_idTocontacts: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.contacts.count({ where })
  ])

  return {
    contacts,
    total,
    hasMore: offset + contacts.length < total
  }
}

/**
 * Create new contact with duplicate checking
 */
export async function createContact(
  accountId: string,
  contactData: {
    first_name: string
    last_name?: string
    email?: string
    phone?: string
    category?: string
    business_name?: string
    notes?: string
  }
) {
  // Check for potential duplicates
  if (contactData.email) {
    const existingByEmail = await prisma.contacts.findFirst({
      where: {
        account_id: accountId,
        email: contactData.email
      },
      select: { id: true, first_name: true, last_name: true }
    })

    if (existingByEmail) {
      throw new Error(`Contact with email ${contactData.email} already exists`)
    }
  }

  return await prisma.contacts.create({
    data: {
      account_id: accountId,
      source: 'manual',
      status: 'draft',
      ...contactData
    }
  })
}

// ============================================================================
// REVIEW OPERATIONS
// ============================================================================

/**
 * Get reviews with comprehensive filtering
 */
export async function getReviews(
  accountId: string,
  options: {
    businessId?: string
    platform?: string
    verified?: boolean
    minRating?: number
    dateFrom?: Date
    dateTo?: Date
    limit?: number
    offset?: number
  } = {}
) {
  const { 
    businessId, 
    platform, 
    verified, 
    minRating, 
    dateFrom, 
    dateTo, 
    limit = 50, 
    offset = 0 
  } = options

  // Build where clause
  const where: Prisma.review_submissionsWhereInput = {
    prompt_pages: {
      account_id: accountId
    },
    ...(businessId && { business_id: businessId }),
    ...(platform && { platform }),
    ...(typeof verified === 'boolean' && { verified }),
    ...(minRating && { star_rating: { gte: minRating } }),
    ...(dateFrom || dateTo) && {
      created_at: {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo })
      }
    }
  }

  const [reviews, total] = await Promise.all([
    prisma.review_submissions.findMany({
      where,
      include: {
        prompt_pages: {
          select: {
            id: true,
            slug: true,
            type: true,
            client_name: true
          }
        },
        businesses: {
          select: {
            id: true,
            name: true,
            logo_url: true
          }
        },
        contacts_review_submissions_contact_idTocontacts: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.review_submissions.count({ where })
  ])

  return {
    reviews,
    total,
    hasMore: offset + reviews.length < total
  }
}

// ============================================================================
// WIDGET OPERATIONS
// ============================================================================

/**
 * Get widget with its reviews
 */
export async function getWidgetWithReviews(widgetId: string) {
  return await prisma.widgets.findUnique({
    where: { id: widgetId },
    include: {
      widget_reviews: {
        where: { verified: true },
        orderBy: [
          { order_index: 'asc' },
          { created_at: 'desc' }
        ],
        select: {
          id: true,
          first_name: true,
          last_name: true,
          reviewer_role: true,
          review_content: true,
          star_rating: true,
          photo_url: true,
          platform: true,
          created_at: true
        }
      },
      accounts: {
        select: {
          business_name: true,
          plan: true
        }
      },
      _count: {
        select: {
          widget_reviews: {
            where: { verified: true }
          }
        }
      }
    }
  })
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

/**
 * Get dashboard analytics for an account
 */
export async function getDashboardAnalytics(accountId: string) {
  const [
    accountInfo,
    promptPagesCount,
    contactsCount,
    reviewsCount,
    recentActivity
  ] = await Promise.all([
    // Account info
    prisma.accounts.findUnique({
      where: { id: accountId },
      select: {
        plan: true,
        created_at: true,
        trial_end: true,
        max_contacts: true,
        max_prompt_pages: true
      }
    }),

    // Prompt pages by status
    prisma.prompt_pages.groupBy({
      by: ['status'],
      where: { account_id: accountId },
      _count: true
    }),

    // Contacts count
    prisma.contacts.count({
      where: { account_id: accountId }
    }),

    // Reviews count and average rating
    prisma.review_submissions.aggregate({
      where: {
        prompt_pages: {
          account_id: accountId
        },
        verified: true,
        star_rating: { not: null }
      },
      _count: true,
      _avg: {
        star_rating: true
      }
    }),

    // Recent activity
    prisma.review_submissions.findMany({
      where: {
        prompt_pages: {
          account_id: accountId
        }
      },
      include: {
        prompt_pages: {
          select: {
            slug: true,
            client_name: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    })
  ])

  return {
    account: accountInfo,
    promptPages: promptPagesCount.reduce((acc, curr) => {
      acc[curr.status || 'unknown'] = curr._count
      return acc
    }, {} as Record<string, number>),
    totalContacts: contactsCount,
    reviews: {
      total: reviewsCount._count,
      averageRating: reviewsCount._avg.star_rating
        ? Math.round(reviewsCount._avg.star_rating * 10) / 10
        : 0
    },
    recentActivity
  }
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Handle Prisma errors with user-friendly messages
 */
export function handlePrismaError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return 'A record with this information already exists'
      case 'P2025':
        return 'Record not found'
      case 'P2003':
        return 'Related record not found'
      case 'P2014':
        return 'Invalid relationship data'
      default:
        return 'Database operation failed'
    }
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

// ============================================================================
// TRANSACTION EXAMPLES
// ============================================================================

/**
 * Create prompt page with contact in a transaction
 */
export async function createPromptPageWithContact(
  accountId: string,
  promptPageData: {
    type: 'service' | 'product'
    name?: string
    client_name?: string
    // ... other prompt page fields
  },
  contactData: {
    first_name: string
    last_name?: string
    email?: string
    phone?: string
  }
) {
  return await prisma.$transaction(async (tx) => {
    // Create contact first
    const contact = await tx.contacts.create({
      data: {
        account_id: accountId,
        source: 'manual',
        ...contactData
      }
    })

    // Create prompt page linked to contact
    const slug = await generateUniqueSlug(
      promptPageData.name || promptPageData.client_name || 'prompt-page'
    )

    const promptPage = await tx.prompt_pages.create({
      data: {
        account_id: accountId,
        contact_id: contact.id,
        slug,
        status: 'draft',
        ...promptPageData
      },
      include: {
        contacts: true
      }
    })

    return { promptPage, contact }
  })
}