/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF8F2',
          200: '#F5F2E9', // Main application background
          300: '#ECE8DD',
          400: '#DDD8CA'
        },
        forest: {
          50: '#E8F1EC',
          100: '#DDE9DD', // Soft green background
          200: '#B8D5C2',
          500: '#2E7654', // Secondary green
          600: '#235D42',
          700: '#174C38', // Primary brand green
          800: '#123C2B', // Hover green
          900: '#0B261B'
        },
        charcoal: {
          500: '#69756D', // Secondary text
          700: '#3D4D44',
          800: '#2F3C34',
          900: '#26352D'  // Primary text
        },
        subtle: {
          border: '#DEDCD1',
          divider: '#E8E5DA'
        },
        alert: {
          error: '#B54747',
          warning: '#A66B24',
          success: '#2E7654'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace']
      }
    },
  },
  plugins: [],
}
