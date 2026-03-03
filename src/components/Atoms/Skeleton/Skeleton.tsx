import React from 'react';
import './Skeleton.css';

export type SkeletonVariant = 'text' | 'title' | 'avatar' | 'card' | 'rect';

export interface SkeletonProps {
    variant?: SkeletonVariant;
    width?: string | number;
    height?: string | number;
    count?: number;
    className?: string;
    animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    count = 1,
    className = '',
    animation = 'pulse',
}) => {
    const getVariantStyles = (): React.CSSProperties => {
        const styles: React.CSSProperties = {};

        if (width) {
            styles.width = typeof width === 'number' ? `${width}px` : width;
        }
        if (height) {
            styles.height = typeof height === 'number' ? `${height}px` : height;
        }

        switch (variant) {
            case 'text':
                return { height: 16, marginBottom: 8, ...styles };
            case 'title':
                return { height: 24, width: '60%', marginBottom: 12, ...styles };
            case 'avatar':
                return { width: 40, height: 40, borderRadius: '50%', ...styles };
            case 'card':
                return { height: 200, borderRadius: 12, ...styles };
            case 'rect':
                return { ...styles };
            default:
                return styles;
        }
    };

    const animationClass = animation === 'pulse' ? 'skeleton--pulse' : animation === 'wave' ? 'skeleton--wave' : '';

    const items = Array.from({ length: count }, (_, i) => i);

    return (
        <>
            {items.map((i) => (
                <div
                    key={i}
                    className={`skeleton ${animationClass} ${className}`}
                    style={getVariantStyles()}
                />
            ))}
        </>
    );
};

export default Skeleton;
