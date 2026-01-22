import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || props.name;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-semibold text-[#8b7355] mb-2 uppercase tracking-wide"
                >
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`
                    w-full px-4 py-3 rounded-xl border-2 bg-white text-[#2d1b0e]
                    placeholder:text-[#8b7355]/50
                    focus:outline-none focus:ring-4 focus:ring-[#c17767]/20
                    transition-all duration-200
                    ${error
                        ? 'border-[#c5503c] focus:border-[#c5503c]'
                        : 'border-[#e2e8f0] focus:border-[#c17767] hover:border-[#c17767]/50'}
                    ${className}
                `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-[#c5503c] font-medium animate-slide-up">
                    {error}
                </p>
            )}
        </div>
    );
};
