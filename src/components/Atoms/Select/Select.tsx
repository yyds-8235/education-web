import React from 'react';
import { Select as AntSelect } from 'antd';
import type { SelectProps as AntSelectProps } from 'antd';
import './Select.css';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends Omit<AntSelectProps, 'size'> {
    label?: string;
    error?: string;
    hint?: string;
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    required?: boolean;
    options?: SelectOption[];
}

const sizeClassMap = {
    small: 'select--small',
    medium: 'select--medium',
    large: 'select--large',
};

const Select: React.FC<SelectProps> = ({
    label,
    error,
    hint,
    size = 'medium',
    fullWidth = true,
    required = false,
    options = [],
    className = '',
    disabled,
    placeholder = '请选择',
    ...rest
}) => {
    const selectClassName = `
    custom-select 
    ${sizeClassMap[size]} 
    ${fullWidth ? 'select--full-width' : ''} 
    ${error ? 'select--error' : ''} 
    ${disabled ? 'select--disabled' : ''}
    ${className}
  `.trim();

    return (
        <div className="select-wrapper">
            {label && (
                <label className={`select-label ${required ? 'label-required' : ''}`}>
                    {label}
                </label>
            )}
            <AntSelect
                className={selectClassName}
                disabled={disabled}
                status={error ? 'error' : undefined}
                placeholder={placeholder}
                options={options}
                popupClassName="custom-select-dropdown"
                {...rest}
            />
            {error && <span className="select-error">{error}</span>}
            {hint && !error && <span className="select-hint">{hint}</span>}
        </div>
    );
};

export default Select;
