"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = getCategories;
exports.getImagesInCategory = getImagesInCategory;
exports.getRandomImage = getRandomImage;
exports.getImagePath = getImagePath;
exports.saveUploadedImage = saveUploadedImage;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.svg']);
function getImagesDir() {
    return path_1.default.resolve(process.env.IMAGES_DIR || './data/images');
}
function getCategories() {
    const root = getImagesDir();
    if (!fs_1.default.existsSync(root))
        return [];
    return fs_1.default.readdirSync(root, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort();
}
function getImagesInCategory(category) {
    const dir = path_1.default.join(getImagesDir(), category);
    if (!fs_1.default.existsSync(dir))
        return [];
    return fs_1.default.readdirSync(dir)
        .filter((f) => IMAGE_EXTENSIONS.has(path_1.default.extname(f).toLowerCase()));
}
function getRandomImage(category) {
    let targetCategory = category;
    if (!targetCategory) {
        const cats = getCategories();
        if (cats.length === 0)
            return null;
        targetCategory = cats[Math.floor(Math.random() * cats.length)];
    }
    const images = getImagesInCategory(targetCategory);
    if (images.length === 0)
        return null;
    const filename = images[Math.floor(Math.random() * images.length)];
    return { category: targetCategory, filename };
}
function getImagePath(category, filename) {
    const safeCategory = path_1.default.basename(category);
    const safeFilename = path_1.default.basename(filename);
    const filePath = path_1.default.join(getImagesDir(), safeCategory, safeFilename);
    if (!fs_1.default.existsSync(filePath))
        return null;
    return filePath;
}
function saveUploadedImage(category, filename, data) {
    const safeCategory = path_1.default.basename(category);
    const safeFilename = path_1.default.basename(filename);
    const dir = path_1.default.join(getImagesDir(), safeCategory);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    const dest = path_1.default.join(dir, safeFilename);
    fs_1.default.writeFileSync(dest, data);
    return safeFilename;
}
//# sourceMappingURL=imageService.js.map