import app from './app.js'
import config from './config/index.js'
import { connectDB } from './config/db.js'

connectDB().then(() => {
  app.listen(config.port, () => {
    console.log(`\n💌  Letter from Heart API`)
    console.log(`   Environment : ${config.nodeEnv}`)
    console.log(`   Listening on: http://localhost:${config.port}`)
    console.log(`   Health check: http://localhost:${config.port}/api/health\n`)
  })
})
