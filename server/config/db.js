import mongoose from 'mongoose'
import config from './index.js'

export async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      dbName: 'letterfromheart',
    })
    console.log(`   MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.error('   MongoDB connection failed:', err.message)
    process.exit(1)
  }
}
