export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

export function getFileType(filename: string): string {
    const ext = getFileExtension(filename).toLowerCase();

    const typeMap: Record<string, string> = {
        mp4: 'video',
        webm: 'video',
        mov: 'video',
        avi: 'video',
        pdf: 'pdf',
        doc: 'word',
        docx: 'word',
        ppt: 'ppt',
        pptx: 'ppt',
        xls: 'excel',
        xlsx: 'excel',
        jpg: 'image',
        jpeg: 'image',
        png: 'image',
        gif: 'image',
        mp3: 'audio',
        wav: 'audio',
    };

    return typeMap[ext] || 'other';
}

export function isImageFile(filename: string): boolean {
    const ext = getFileExtension(filename).toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
}

export function isVideoFile(filename: string): boolean {
    const ext = getFileExtension(filename).toLowerCase();
    return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);
}

export function isDocumentFile(filename: string): boolean {
    const ext = getFileExtension(filename).toLowerCase();
    return ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext);
}
