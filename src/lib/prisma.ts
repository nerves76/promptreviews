import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a singleton Prisma client instance
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// In development, store the client globally to prevent multiple instances
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

// Helper types for common use cases
export type {
  accounts,
  businesses,
  contacts,
  prompt_pages,
  review_submissions,
  widgets,
  Prisma
} from '../generated/prisma'