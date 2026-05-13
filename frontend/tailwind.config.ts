import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        argila: '#EAE4DA',
        'argila-card': '#F0EBE3',
        'argila-borda': '#D4CCC4',
        musgo: '#6B6B2A',
        'musgo-escuro': '#555520',
        texto: '#2C2C2A',
        muted: '#B8AFA5',
        perigo: '#8B4A3A',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        corpo: ['"DM Sans"', 'sans-serif'],
        sotaque: ['Sacramento', 'cursive'],
      },
    },
  },
  plugins: [],
}

export default config
