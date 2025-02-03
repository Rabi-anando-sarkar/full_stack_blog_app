import dotenv from 'dotenv'
import { connectDB } from './src/db/index.js'
import { app } from './app.js'
import { PORT } from './constant.js'

dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
    app.on('error',(error) => {
        console.log(`SERVER ERROR :: ${error}`);
        throw error
    })
    app.listen(PORT || 8001, () => {
        console.log(`SERVER IS SUCCESFULLY RUNNING AT ${PORT} IF NOT TRY PORT 8001`);
    })
})