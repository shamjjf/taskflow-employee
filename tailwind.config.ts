import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5b5bd6',
          hover: '#4a4ac7',
          soft: '#eeeefc',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f4f4f5',
          subtle: '#fafafa',
        },
        border: {
          DEFAULT: '#e4e4e7',
          strong: '#d4d4d8',
        },
        success: { DEFAULT: '#10b981', soft: '#ecfdf5' },
        warning: { DEFAULT: '#f59e0b', soft: '#fffbeb' },
        danger: { DEFAULT: '#ef4444', soft: '#fef2f2' },
        info: { DEFAULT: '#3b82f6', soft: '#eff6ff' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
};

export default config;
