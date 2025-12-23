// File: downloadTextures.js
// Usage: node downloadTextures.js
import fs from 'fs';
import https from 'https';
import path from 'path';

const textures = [
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Grass_texture.jpg',
    filename: 'grass.jpg',
  },
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Sky_blue.jpg',
    filename: 'sky.jpg',
  },
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Mountains_from_Small_Buttes%2C_Utah.jpg',
    filename: 'mountains.jpg',
  },
];

const texturesDir = path.join('src', 'assets', 'textures');

// Ensure directory exists
if (!fs.existsSync(texturesDir)) {
  fs.mkdirSync(texturesDir, { recursive: true });
}

function downloadTexture(texture) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(texturesDir, texture.filename);
    const file = fs.createWriteStream(filePath);

    https.get(texture.url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${texture.filename}: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`${texture.filename} saved to ${filePath}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => reject(err));
    });
  });
}

(async () => {
  for (const tex of textures) {
    try {
      await downloadTexture(tex);
    } catch (err) {
      console.error(err.message);
    }
  }
  console.log('All downloads attempted.');
})();
