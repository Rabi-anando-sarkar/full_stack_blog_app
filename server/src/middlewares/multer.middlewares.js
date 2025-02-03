import multer from 'multer'
import path from 'path';
import { fileURLToPath } from 'url';

const storage = multer.diskStorage({
    destination: function(req,file,cb) {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const uploadPath = path.join(__dirname, '../../public/temp');
        cb(null,uploadPath)
    },
    filename: function(req,file,cb) {
        cb(null, file.originalname)
    }
})

export const upload = multer({
    storage
})