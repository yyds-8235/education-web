import React from 'react';
import { Tooltip as AntTooltip } from 'antd';
import type { TooltipPropsWithTitle } from 'antd/es/tooltip';
import './Tooltip.css';

export interface TooltipProps extends Omit<TooltipPropsWithTitle, 'title'> {
    content: React.ReactNode;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const placementMap: Record<string, TooltipProps['position']> = {
    top: 'top',
    bottom: 'bottom',
    left: 'left',
    right: 'right',
};

const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    ...rest
}) => {
    return (
        <AntTooltip
            title={content}
            placement={placementMap[position]}
            overlayClassName="custom-tooltip"
            {...rest}
        >
            <span className="tooltip-trigger">{children}</span>
        </AntTooltip>
    );
};

export default Tooltip;
