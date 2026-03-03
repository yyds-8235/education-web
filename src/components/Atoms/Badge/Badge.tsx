import React from 'react';
import './Badge.css';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';
export type BadgeSize = 'small' | 'medium' | 'large';

export interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: BadgeSize;
    dot?: boolean;
    count?: number;
    maxCount?: number;
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'primary',
    size = 'medium',
    dot = false,
    count,
    maxCount = 99,
    className = '',
}) => {
    const showCount = count !== undefined && count > 0;
    const displayCount = count && maxCount && count > maxCount ? `${maxCount}+` : count;

    if (dot || showCount) {
        return (
            <span className={`badge-container ${className}`}>
                {children}
                <span
                    className={`badge badge--${variant} badge--${size} ${dot ? 'badge--dot' : 'badge--count'}`}
                >
                    {!dot && displayCount}
                </span>
            </span>
        );
    }

    return (
        <span className={`badge badge--${variant} badge--${size} badge--inline ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
