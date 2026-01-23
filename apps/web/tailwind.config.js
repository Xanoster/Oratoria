/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Dark navy theme
                'navy': {
                    50: '#E6E8F0',
                    100: '#C1C7DC',
                    200: '#9BA5C8',
                    300: '#7583B4',
                    400: '#4F61A0',
                    500: '#2A3F8C',
                    600: '#1E2D6B',
                    700: '#151F4E',
                    800: '#0D1333',
                    900: '#0A0E1A',
                    950: '#070A12',
                },
                'primary': {
                    DEFAULT: '#3B82F6',
                    dark: '#2563EB',
                    light: '#60A5FA',
                },
            },
            backgroundColor: {
                'app': '#0A0E1A',
                'card-dark': '#0F1729',
            },
            borderColor: {
                'card': '#1E293B',
            },
        },
    },
    plugins: [],
}
