import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        base: '#F7F7F8',
        primary: '#625DF5',
        'primary-hover': '#342DF2',
        accent: '#9ECCFE',
      },
    },
  },
  plugins: [],
}
export default config
