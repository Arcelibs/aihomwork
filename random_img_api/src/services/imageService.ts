import fs from 'fs';
import path from 'path';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.svg']);

function getImagesDir(): string {
  return path.resolve(process.env.IMAGES_DIR || './data/images');
}

export function getCategories(): string[] {
  const root = getImagesDir();
  if (!fs.existsSync(root)) return [];

  return fs.readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

export function getImagesInCategory(category: string): string[] {
  const dir = path.join(getImagesDir(), category);
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()));
}

export function getRandomImage(category?: string): { category: string; filename: string } | null {
  let targetCategory = category;

  if (!targetCategory) {
    const cats = getCategories();
    if (cats.length === 0) return null;
    targetCategory = cats[Math.floor(Math.random() * cats.length)];
  }

  const images = getImagesInCategory(targetCategory);
  if (images.length === 0) return null;

  const filename = images[Math.floor(Math.random() * images.length)];
  return { category: targetCategory, filename };
}

export function getImagePath(category: string, filename: string): string | null {
  const safeCategory = path.basename(category);
  const safeFilename = path.basename(filename);
  const filePath = path.join(getImagesDir(), safeCategory, safeFilename);

  if (!fs.existsSync(filePath)) return null;
  return filePath;
}

export function saveUploadedImage(category: string, filename: string, data: Buffer): string {
  const safeCategory = path.basename(category);
  const safeFilename = path.basename(filename);
  const dir = path.join(getImagesDir(), safeCategory);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const dest = path.join(dir, safeFilename);
  fs.writeFileSync(dest, data);
  return safeFilename;
}
