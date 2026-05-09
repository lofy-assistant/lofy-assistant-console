import { PrismaClient } from "./generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import mongoose, { type Connection, type ConnectOptions } from "mongoose"

declare global {
  var stagingPrisma: PrismaClient | undefined
  var stagingPool: Pool | undefined
  var stagingMongoose:
    | {
        conn: Connection | null
        promise: Promise<Connection> | null
      }
    | undefined
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Please define the ${name} environment variable`)
  }
  return value
}

export function getStagingPrisma() {
  if (global.stagingPrisma) {
    return global.stagingPrisma
  }

  const pool = global.stagingPool ?? new Pool({ connectionString: requireEnv("STAGING_DATABASE_URL") })
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

  if (process.env.NODE_ENV !== "production") {
    global.stagingPool = pool
    global.stagingPrisma = prisma
  }

  return prisma
}

export async function connectStagingMongo() {
  const uri = process.env.STAGING_MONGODB_URI?.trim() || requireEnv("MONGODB_URI")
  const dbName = process.env.STAGING_MONGODB_NAME?.trim() || "staging_db"

  if (!global.stagingMongoose) {
    global.stagingMongoose = { conn: null, promise: null }
  }

  if (global.stagingMongoose.conn) {
    return global.stagingMongoose.conn
  }

  if (!global.stagingMongoose.promise) {
    const options: ConnectOptions = { bufferCommands: false, dbName }
    global.stagingMongoose.promise = mongoose.createConnection(uri, options).asPromise()
  }

  global.stagingMongoose.conn = await global.stagingMongoose.promise
  return global.stagingMongoose.conn
}
