import { forwardRef, useState, useId } from 'react';
import { Input as AntInput } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import type { InputProps as AntInputProps, InputRef } from 'antd';
import './Input.css';

export interface InputProps extends Omit<AntInputProps, 'size'> {
    label?: string;
    error?: string;
    hint?: string;
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    required?: boolean;
}

const sizeClassMap = {
    small: 'input--small',
    medium: 'input--medium',
    large: 'input--large',
};

const Input = forwardRef<InputRef, InputProps>(
    (
        {
            label,
            error,
            hint,
            size = 'medium',
            fullWidth = true,
            required = false,
            className = '',
            type = 'text',
            disabled,
            ...rest
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const inputId = useId();

        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        const inputClassName = `
      custom-input 
      ${sizeClassMap[size]} 
      ${fullWidth ? 'input--full-width' : ''} 
      ${error ? 'input--error' : ''} 
      ${disabled ? 'input--disabled' : ''}
      ${className}
    `.trim();

        return (
            <div className="input-wrapper">
                {label && (
                    <label htmlFor={inputId} className={`input-label ${required ? 'label-required' : ''}`}>
                        {label}
                    </label>
                )}
                <div className="input-container">
                    <AntInput
                        ref={ref}
                        id={inputId}
                        type={inputType}
                        className={inputClassName}
                        disabled={disabled}
                        status={error ? 'error' : undefined}
                        {...rest}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        </button>
                    )}
                </div>
                {error && <span className="input-error">{error}</span>}
                {hint && !error && <span className="input-hint">{hint}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
