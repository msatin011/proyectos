/** @type {import('tailwindcss').Config} */
module.exports = {
  safelist: [
    // Animations
    'animate-fade-in-right',
    'animate-fade-out',
    'animate-pulsate',
    'animate-spin',
    'animate-pulse',
    'animate-bounce',

    // Common backgrounds
    'bg-white',
    'bg-gray-50',
    'bg-gray-100',
    'bg-gray-200',
    'bg-gray-300',
    'bg-gray-400',
    'bg-gray-500',
    'bg-gray-600',
    'bg-gray-700',
    'bg-gray-800',
    'bg-gray-900',
    'bg-blue-50',
    'bg-blue-100',
    'bg-blue-200',
    'bg-blue-500',
    'bg-blue-600',
    'bg-blue-700',
    'bg-green-50',
    'bg-green-100',
    'bg-green-500',
    'bg-green-600',
    'bg-orange-500',
    'bg-red-50',
    'bg-red-100',
    'bg-red-500',
    'bg-red-600',
    'bg-yellow-50',
    'bg-yellow-100',
    'bg-indigo-600',

    // Text colors
    'text-white',
    'text-gray-300',
    'text-gray-400',
    'text-gray-500',
    'text-gray-600',
    'text-gray-700',
    'text-gray-800',
    'text-gray-900',
    'text-blue-500',
    'text-blue-600',
    'text-blue-700',
    'text-green-500',
    'text-green-600',
    'text-green-700',
    'text-red-500',
    'text-red-600',
    'text-yellow-600',

    // Borders
    'border',
    'border-2',
    'border-gray-100',
    'border-gray-200',
    'border-gray-300',
    'border-blue-200',
    'border-blue-500',
    'border-green-500',
    'border-red-500',

    // Common utilities
    'w-full',
    'w-72',
    'translate-x-0',
    '-translate-x-full',
    'hidden',
    'block',
    'flex',
    'inline-flex',
    'inline-block',
    'grid',
    'opacity-0',
    'opacity-50',
    'opacity-100',
    'rounded',
    'rounded-lg',
    'shadow',
    'shadow-outline',
    'font-bold',
    'text-sm',
    'text-white',
    'py-2',
    'px-4',
    'mt-4',
    'mb-6',
    'focus:outline-none',
    'focus:shadow-outline',

    // Theme colors
    'bg-theme-primary',
    'bg-theme-secondary',
    'text-theme-primary',
    'text-theme-accent',
    'hover:bg-theme-secondary',
    'hover:text-theme-accent',

    // Z-index
    'z-10',
    'z-20',
    'z-30',
    'z-40',
    'z-50',
    'z-[60]',
    'z-[80]',
    'z-[90]',
    'z-[100]',
    'z-[110]',
    'z-[120]',
    'z-[200]',
    'z-[300]',

    // Hover states - patterns
    {
      pattern: /bg-(blue|green|red|gray|indigo)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /text-(blue|green|red|gray|white|yellow|indigo)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /hover:bg-(blue|green|red|gray|indigo)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /hover:text-(blue|green|red|gray|white)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /border-(blue|green|red|gray)-(50|100|200|300|400|500|600|700|800|900)/,
    },
  ],
  content: [
    "./*.html",
    "./js/**/*.js",
    "./pwa/**/*.{html,js}",
    "./ayudas/**/*.html",
    "./templates/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        'theme-primary': 'var(--color-primary)',
        'theme-secondary': 'var(--color-secondary)',
        'theme-accent': 'var(--color-accent)',
        'theme-bg': 'var(--color-bg)',
        'theme-text': 'var(--color-text)',
      },
      animation: {
        'pulsate': 'pulsate 1.5s ease-in-out infinite',
        'fade-in-right': 'fade-in-right 0.5s ease-out forwards',
        'fade-out': 'fade-out 0.5s ease-in forwards',
      },
      keyframes: {
        pulsate: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
        },
        'fade-in-right': {
          'from': { opacity: '0', transform: 'translateX(100%)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-out': {
          'from': { opacity: '1' },
          'to': { opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}