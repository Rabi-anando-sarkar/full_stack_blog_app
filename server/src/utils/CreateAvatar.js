import { createAvatar } from '@dicebear/core';
import { identicon } from '@dicebear/collection';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { ApiError } from './ApiError.js'
import { fileURLToPath } from 'url';
import { toWebp } from '@dicebear/converter';

const createAvatarWebp = async (user) => {
    try {
        const avatar = createAvatar(identicon, {
            seed: user,
            "backgroundColor": [
                "b6e3f4",
                "c0aede",
                "d1d4f9",
                "ffd5dc",
                "ffdfbf"
            ]
        });

        const svg = avatar.toString();

        const webp = toWebp(svg, {});
        const arrayBuffer =await webp.toArrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const folderPath = path.join(__dirname, '../../public/temp');
        await mkdir(folderPath, { recursive: true });
        const filename = Array.from({length: 19}, () => Math.floor(Math.random() * 10)).join('').padStart(20, Math.floor(Math.random() * 9) + 1);
        const filePath = path.join(folderPath, `${filename}.webp`);
        await writeFile(filePath, buffer);
        return filePath;
    } catch (error) {
        throw new ApiError(500, `AVATAR CREATION FAILED`);
    }
}

export {
    createAvatarWebp
}