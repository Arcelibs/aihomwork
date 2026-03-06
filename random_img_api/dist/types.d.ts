export interface Token {
    id: number;
    token: string;
    name: string;
    created_at: string;
    last_used_at: string | null;
    is_active: number;
    request_count: number;
}
export interface TokenListItem {
    id: number;
    token_preview: string;
    name: string;
    created_at: string;
    last_used_at: string | null;
    is_active: number;
    request_count: number;
}
export interface ImageInfo {
    filename: string;
    category: string;
    url: string;
}
export type ResponseFormat = 'stream' | 'json';
//# sourceMappingURL=types.d.ts.map