export interface ApiResponse<T = unknown> {
    code: number;
    message: string;
    data: T;
}

export interface PaginatedResponse<T> {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface PaginationParams {
    page: number;
    pageSize: number;
}

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface TreeNode {
    key: string;
    title: string;
    children?: TreeNode[];
    isLeaf?: boolean;
}

export interface UploadFile {
    uid: string;
    name: string;
    status: 'uploading' | 'done' | 'error';
    url?: string;
    percent?: number;
    size?: number;
    type?: string;
}

export interface ChartData {
    name: string;
    value: number;
    [key: string]: string | number;
}

export interface DateRange {
    start: string;
    end: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortParams {
    field: string;
    direction: SortDirection;
}
