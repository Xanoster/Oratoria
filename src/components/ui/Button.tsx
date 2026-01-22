import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className = '',
    disabled,
    ...props
}) => {
    // Base classes
    const baseClasses = 'font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

    // Variant styles
    const variants = {
        primary: 'bg-gradient-to-br from-[#c17767] to-[#8b5e3c] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5',
        secondary: 'bg-white text-[#c17767] border-2 border-[#c17767] hover:bg-[#faf5f0]',
        danger: 'bg-gradient-to-br from-[#c5503c] to-[#9e2b2b] text-white shadow-md hover:shadow-lg',
        ghost: 'bg-transparent text-[#5c4a3a] hover:bg-[#faf5f0]',
    };

    // Size styles
    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} relative overflow-hidden`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    <span>Loading...</span>
                </div>
            ) : children}
        </button>
    );
};
