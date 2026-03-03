import React from 'react';
import { Avatar as AntAvatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { AvatarProps as AntAvatarProps } from 'antd';
import './Avatar.css';

export type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface AvatarProps extends Omit<AntAvatarProps, 'size'> {
    size?: AvatarSize;
    name?: string;
}

const sizeMap: Record<AvatarSize, number> = {
    small: 32,
    medium: 40,
    large: 48,
    xlarge: 64,
};

const fontSizeMap: Record<AvatarSize, number> = {
    small: 12,
    medium: 14,
    large: 16,
    xlarge: 20,
};

const Avatar: React.FC<AvatarProps> = ({
    size = 'medium',
    name,
    src,
    className = '',
    ...rest
}) => {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const avatarSize = sizeMap[size];
    const fontSize = fontSizeMap[size];

    return (
        <AntAvatar
            size={avatarSize}
            src={src}
            icon={!src && !name && <UserOutlined />}
            className={`custom-avatar ${className}`}
            style={{ fontSize }}
            {...rest}
        >
            {name && !src && getInitials(name)}
        </AntAvatar>
    );
};

export default Avatar;
