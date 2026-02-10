import { PrismaClient } from './generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import type { Mongoose, ConnectOptions } from 'mongoose'
import mongoose from 'mongoose'

declare global {
  var prisma: PrismaClient | undefined
  var pool: Pool | undefined
  var mongoose: {
    conn: Mongoose | null
    promise: Promise<Mongoose> | null
  }
}

// Validate environment variables
const DATABASE_URL = process.env.DATABASE_URL as string
const MONGODB_URI = process.env.MONGODB_URI as string
// Optional: allow explicit DB name via env `MONGODB_NAME` (recommended for production)
const MONGODB_NAME = process.env.MONGODB_NAME as string | undefined

if (!DATABASE_URL) {
  throw new Error('Please define the DATABASE_URL environment variable')
}

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

// PostgreSQL with Prisma
const pool = global.pool ?? new Pool({ connectionString: DATABASE_URL })
const adapter = new PrismaPg(pool)

export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// MongoDB with Mongoose
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export async function connectMongo() {
  // Read requested DB name at call time (serverless-friendly)
  const expectedDbName = process.env.MONGODB_NAME || MONGODB_NAME

  // If we already have a connection and it's for the expected DB, return it
  if (cached.conn) {
    const currentDbName = mongoose.connection?.db?.databaseName
    if (expectedDbName && currentDbName !== expectedDbName) {
      // Force reconnect to correct DB
      try {
        await mongoose.disconnect()
      } catch (e) {
        console.warn('DB disconnect warning:', e)
      }
      cached.conn = null
      cached.promise = null
    } else {
      return cached.conn
    }
  }

  if (!cached.promise) {
    const dbName = process.env.MONGODB_NAME || MONGODB_NAME
    const connectOptions: ConnectOptions = { bufferCommands: false }
    if (dbName) connectOptions.dbName = dbName

    cached.promise = mongoose
      .connect(MONGODB_URI, connectOptions)
      .then(() => mongoose)
      .catch((error) => {
        cached.promise = null
        console.error('MongoDB connection error:', error)
        throw error
      })
  }

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (e) {
    cached.promise = null
    throw e
  }
}

// Cache in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
  global.pool = pool
}

// Export utility to check all connections
export async function ensureDbConnections() {
  await connectMongo()
  await prisma.$connect()
  console.log('✅ All database connections ready')
}