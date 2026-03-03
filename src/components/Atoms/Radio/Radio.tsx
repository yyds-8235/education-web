import React from 'react';
import { Radio as AntRadio } from 'antd';
import type { RadioProps as AntRadioProps } from 'antd';
import './Radio.css';

export interface RadioProps extends AntRadioProps {
    label?: string;
    description?: string;
}

const Radio: React.FC<RadioProps> = ({
    label,
    description,
    className = '',
    children,
    ...rest
}) => {
    return (
        <AntRadio className={`custom-radio ${className}`} {...rest}>
            {label && <span className="radio-label">{label}</span>}
            {description && <span className="radio-description">{description}</span>}
            {children}
        </AntRadio>
    );
};

export default Radio;
