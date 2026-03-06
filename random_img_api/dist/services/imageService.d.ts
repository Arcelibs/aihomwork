export declare function getCategories(): string[];
export declare function getImagesInCategory(category: string): string[];
export declare function getRandomImage(category?: string): {
    category: string;
    filename: string;
} | null;
export declare function getImagePath(category: string, filename: string): string | null;
export declare function saveUploadedImage(category: string, filename: string, data: Buffer): string;
//# sourceMappingURL=imageService.d.ts.map