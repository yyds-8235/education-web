import React from 'react';
import { Checkbox as AntCheckbox } from 'antd';
import type { CheckboxProps as AntCheckboxProps } from 'antd';
import './Checkbox.css';

export interface CheckboxProps extends AntCheckboxProps {
    label?: string;
    description?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
    label,
    description,
    className = '',
    children,
    ...rest
}) => {
    return (
        <AntCheckbox className={`custom-checkbox ${className}`} {...rest}>
            {label && <span className="checkbox-label">{label}</span>}
            {description && <span className="checkbox-description">{description}</span>}
            {children}
        </AntCheckbox>
    );
};

export default Checkbox;
