import React, { useState, useRef, useCallback } from 'react';
import { Upload, message, Progress, Button } from 'antd';
import {
    FileOutlined,
    VideoCameraOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    FilePptOutlined,
    CloudUploadOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import './FileUploader.css';

export type FileType = 'video' | 'ppt' | 'word' | 'pdf' | 'other';

export interface FileUploaderProps {
    accept?: string;
    maxSize?: number;
    multiple?: boolean;
    maxCount?: number;
    value?: UploadFile[];
    onChange?: (files: UploadFile[]) => void;
    onUpload?: (file: File) => Promise<{ url: string; id: string }>;
    uploadUrl?: string;
    chunkSize?: number;
    showFileList?: boolean;
    dragable?: boolean;
    className?: string;
    disabled?: boolean;
    listType?: 'text' | 'picture' | 'picture-card';
}

const fileTypeIcons: Record<string, React.ReactNode> = {
    'video/mp4': <VideoCameraOutlined />,
    'video/webm': <VideoCameraOutlined />,
    'video/quicktime': <VideoCameraOutlined />,
    'application/pdf': <FilePdfOutlined />,
    'application/msword': <FileWordOutlined />,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <FileWordOutlined />,
    'application/vnd.ms-powerpoint': <FilePptOutlined />,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': <FilePptOutlined />,
};

const FileUploader: React.FC<FileUploaderProps> = ({
    accept,
    maxSize = 500 * 1024 * 1024,
    multiple = false,
    maxCount = 1,
    value = [],
    onChange,
    uploadUrl = '/api/upload',
    chunkSize = 5 * 1024 * 1024,
    showFileList = true,
    dragable = false,
    className = '',
    disabled = false,
    listType = 'text',
}) => {
    const [messageApi, contextHolder] = message.useMessage();
    const [fileList, setFileList] = useState<UploadFile[]>(value);
    const [uploading, setUploading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const getFileIcon = (file: UploadFile) => {
        const type = file.type || '';
        return fileTypeIcons[type] || <FileOutlined />;
    };

    const beforeUpload = useCallback(
        (file: File) => {
            if (file.size > maxSize) {
                messageApi.error(`文件大小不能超过 ${Math.floor(maxSize / 1024 / 1024)}MB`);
                return false;
            }
            return true;
        },
        [maxSize]
    );

    const uploadChunk = async (
        file: File,
        chunkIndex: number,
        totalChunks: number,
        uploadId: string
    ) => {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('chunkIndex', String(chunkIndex));
        formData.append('totalChunks', String(totalChunks));
        formData.append('uploadId', uploadId);
        formData.append('fileName', file.name);

        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
            signal: abortControllerRef.current?.signal,
        });

        return response.json();
    };

    const customRequest: UploadProps['customRequest'] = async (options) => {
        const { file, onSuccess, onError, onProgress } = options;
        const uploadFile = file as File;
        const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        setUploading(true);
        abortControllerRef.current = new AbortController();

        try {
            const totalChunks = Math.ceil(uploadFile.size / chunkSize);

            for (let i = 0; i < totalChunks; i++) {
                if (abortControllerRef.current?.signal.aborted) {
                    throw new Error('Upload aborted');
                }

                await uploadChunk(uploadFile, i, totalChunks, uploadId);
                const percent = Math.round(((i + 1) / totalChunks) * 100);
                onProgress?.({ percent });
            }

            const completeResponse = await fetch(`${uploadUrl}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uploadId, fileName: uploadFile.name, totalChunks }),
            });

            const result = await completeResponse.json();
            onSuccess?.(result);
        } catch (error) {
            onError?.(error as Error);
        } finally {
            setUploading(false);
        }
    };

    const handleChange: UploadProps['onChange'] = (info) => {
        const newFileList = info.fileList.map((file) => ({
            ...file,
            icon: getFileIcon(file),
        }));
        setFileList(newFileList);
        onChange?.(newFileList);
    };

    const handleRemove = (file: UploadFile) => {
        const newFileList = fileList.filter((f) => f.uid !== file.uid);
        setFileList(newFileList);
        onChange?.(newFileList);
    };

    const handleCancel = () => {
        abortControllerRef.current?.abort();
        setUploading(false);
    };

    const uploadButton = (
        <div className="upload-button">
            <CloudUploadOutlined className="upload-icon" />
            <div className="upload-text">
                {dragable ? '点击或拖拽文件到此区域上传' : '点击上传'}
            </div>
            {maxSize && (
                <div className="upload-hint">
                    最大文件大小: {Math.floor(maxSize / 1024 / 1024)}MB
                </div>
            )}
        </div>
    );

    const uploadProps: UploadProps = {
        accept,
        multiple,
        maxCount,
        fileList,
        beforeUpload,
        customRequest,
        onChange: handleChange,
        onRemove: handleRemove,
        showUploadList: showFileList,
        disabled: disabled || uploading,
        listType,
        className: 'upload-area',
        children: fileList.length >= maxCount ? null : uploadButton,
    };

    return (
        <div className={`file-uploader ${className}`}>
            {contextHolder}
            {dragable ? (
                <Upload.Dragger {...uploadProps} />
            ) : (
                <Upload {...uploadProps} />
            )}
            {uploading && (
                <div className="upload-progress">
                    <Progress percent={50} status="active" />
                    <Button size="small" danger onClick={handleCancel}>
                        取消上传
                    </Button>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
