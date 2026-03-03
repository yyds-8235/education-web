import React from 'react';
import { Button as AntButton, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import type { ButtonProps as AntButtonProps } from 'antd';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends Omit<AntButtonProps, 'size' | 'variant' | 'iconPosition'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

const sizeMap: Record<ButtonSize, 'small' | 'middle' | 'large'> = {
    small: 'small',
    medium: 'middle',
    large: 'large',
};

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'medium',
    loading = false,
    fullWidth = false,
    icon,
    iconPosition = 'left',
    children,
    className = '',
    disabled,
    danger,
    ...rest
}) => {
    const isDanger = variant === 'danger' || danger;
    const antdType = variant === 'primary' || variant === 'danger' ? 'primary' : variant === 'link' ? 'link' : 'default';

    return (
        <AntButton
            type={antdType}
            size={sizeMap[size]}
            loading={loading}
            disabled={disabled}
            danger={isDanger}
            icon={iconPosition === 'left' ? icon : undefined}
            className={`custom-button custom-button--${variant} ${fullWidth ? 'custom-button--full-width' : ''} ${className}`}
            {...rest}
        >
            {loading ? (
                <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />
            ) : (
                <>
                    {children}
                    {iconPosition === 'right' && icon && <span className="button-icon-right">{icon}</span>}
                </>
            )}
        </AntButton>
    );
};

export default Button;
