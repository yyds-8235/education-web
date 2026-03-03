import React from 'react';
import { DatePicker as AntDatePicker } from 'antd';
import type { DatePickerProps as AntDatePickerProps } from 'antd';
import './DatePicker.css';

export interface DatePickerProps extends Omit<AntDatePickerProps, 'size'> {
    label?: string;
    error?: string;
    hint?: string;
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    required?: boolean;
}

const sizeClassMap = {
    small: 'date-picker--small',
    medium: 'date-picker--medium',
    large: 'date-picker--large',
};

const DatePicker: React.FC<DatePickerProps> = ({
    label,
    error,
    hint,
    size = 'medium',
    fullWidth = true,
    required = false,
    className = '',
    disabled,
    format = 'YYYY-MM-DD',
    placeholder = '请选择日期',
    ...rest
}) => {
    const pickerClassName = `
    custom-date-picker 
    ${sizeClassMap[size]} 
    ${fullWidth ? 'date-picker--full-width' : ''} 
    ${error ? 'date-picker--error' : ''} 
    ${disabled ? 'date-picker--disabled' : ''}
    ${className}
  `.trim();

    return (
        <div className="date-picker-wrapper">
            {label && (
                <label className={`date-picker-label ${required ? 'label-required' : ''}`}>
                    {label}
                </label>
            )}
            <AntDatePicker
                className={pickerClassName}
                disabled={disabled}
                status={error ? 'error' : undefined}
                format={format}
                placeholder={placeholder}
                {...rest}
            />
            {error && <span className="date-picker-error">{error}</span>}
            {hint && !error && <span className="date-picker-hint">{hint}</span>}
        </div>
    );
};

export interface DateRangePickerProps {
    label?: string;
    error?: string;
    hint?: string;
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    required?: boolean;
    className?: string;
    disabled?: boolean;
    format?: string;
    onChange?: (dates: [string | null, string | null] | null) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
    label,
    error,
    hint,
    size = 'medium',
    fullWidth = true,
    required = false,
    className = '',
    disabled,
    format = 'YYYY-MM-DD',
    onChange,
}) => {
    const pickerClassName = `
    custom-date-picker 
    custom-date-range-picker
    ${sizeClassMap[size]} 
    ${fullWidth ? 'date-picker--full-width' : ''} 
    ${error ? 'date-picker--error' : ''} 
    ${disabled ? 'date-picker--disabled' : ''}
    ${className}
  `.trim();

    return (
        <div className="date-picker-wrapper">
            {label && (
                <label className={`date-picker-label ${required ? 'label-required' : ''}`}>
                    {label}
                </label>
            )}
            <AntDatePicker.RangePicker
                className={pickerClassName}
                disabled={disabled}
                status={error ? 'error' : undefined}
                format={format}
                placeholder={['开始日期', '结束日期'] as [string, string]}
                onChange={(dates) => {
                    if (onChange) {
                        if (dates) {
                            onChange([dates[0]?.format(format) || null, dates[1]?.format(format) || null]);
                        } else {
                            onChange(null);
                        }
                    }
                }}
            />
            {error && <span className="date-picker-error">{error}</span>}
            {hint && !error && <span className="date-picker-hint">{hint}</span>}
        </div>
    );
};

export default DatePicker;
