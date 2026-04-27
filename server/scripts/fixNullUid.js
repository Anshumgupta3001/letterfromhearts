/**
 * One-time migration: remove uid: null from all email users so the sparse
 * unique index on uid only covers Google users (who always have a real uid).
 *
 * Run once from inside the server/ directory:
 *   node scripts/fixNullUid.js
 */
import dotenv from 'dotenv'
dotenv.config()
import { connectDB } from '../config/db.js'
import User from '../models/User.js'

await connectDB()

const result = await User.updateMany(
  { uid: null },
  { $unset: { uid: '' } }
)

console.log(`✅ Removed uid:null from ${result.modifiedCount} email user document(s)`)
process.exit(0)
