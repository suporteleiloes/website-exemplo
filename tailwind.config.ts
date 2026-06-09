import type { Config } from 'tailwindcss';

// As cores reais do leiloeiro vêm de GET /site/config (cores.primaria/secundaria/destaque)
// e são injetadas como CSS variables no <html> (ver app/layout.tsx + globals.css).
// Aqui mapeamos essas variables pra classes utilitárias Tailwind.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marca: 'var(--cor-primaria)',
        'marca-2': 'var(--cor-secundaria)',
        destaque: 'var(--cor-destaque)',
      },
    },
  },
  plugins: [],
};

export default config;
