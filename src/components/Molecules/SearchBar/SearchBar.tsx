import React, { useState, useCallback } from 'react';
import { Input, Button } from 'antd';
import { SearchOutlined, CloseCircleFilled } from '@ant-design/icons';
import './SearchBar.css';

export interface SearchBarProps {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onSearch?: (value: string) => void;
    onClear?: () => void;
    loading?: boolean;
    allowClear?: boolean;
    showSearchButton?: boolean;
    filters?: React.ReactNode;
    className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
    placeholder = '搜索...',
    value: controlledValue,
    onChange,
    onSearch,
    onClear,
    loading = false,
    allowClear = true,
    showSearchButton = false,
    filters,
    className = '',
}) => {
    const [internalValue, setInternalValue] = useState('');
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            if (controlledValue === undefined) {
                setInternalValue(newValue);
            }
            onChange?.(newValue);
        },
        [controlledValue, onChange]
    );

    const handleSearch = useCallback(() => {
        onSearch?.(value);
    }, [value, onSearch]);

    const handleClear = useCallback(() => {
        if (controlledValue === undefined) {
            setInternalValue('');
        }
        onChange?.('');
        onClear?.();
    }, [controlledValue, onChange, onClear]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        },
        [handleSearch]
    );

    return (
        <div className={`search-bar ${className}`}>
            <div className="search-bar-input-wrapper">
                <Input
                    prefix={<SearchOutlined className="search-icon" />}
                    suffix={
                        allowClear && value ? (
                            <CloseCircleFilled
                                className="clear-icon"
                                onClick={handleClear}
                            />
                        ) : null
                    }
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className="search-input"
                    allowClear={false}
                />
                {showSearchButton && (
                    <Button
                        type="primary"
                        onClick={handleSearch}
                        loading={loading}
                        className="search-button"
                    >
                        搜索
                    </Button>
                )}
            </div>
            {filters && <div className="search-bar-filters">{filters}</div>}
        </div>
    );
};

export default SearchBar;
