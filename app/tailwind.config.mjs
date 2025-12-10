/** @type {import('tailwindcss').Config} */
const config = {
    darkMode: ["class"],
    content: [
      './pages/**/*.{ts,tsx}',
      './components/**/*.{ts,tsx}',
      './app/**/*.{ts,tsx}',
      './src/**/*.{ts,tsx}',
    ],
    prefix: "",
    theme: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      extend: {
        // Estendemos as sombras para incluir nossa variante "Soft"
        boxShadow: {
          // Sombras padrão do Tailwind (mantidas para compatibilidade)
          'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          
          // --- NOVO: Sombras Soft UI (Mais difusas e leves) ---
          'soft-xs': '0 2px 4px -1px rgba(0, 0, 0, 0.02), 0 1px 2px -1px rgba(0, 0, 0, 0.02)',
          'soft-sm': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
          'soft-md': '0 8px 12px -2px rgba(0, 0, 0, 0.03), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
          'soft-lg': '0 15px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -5px rgba(0, 0, 0, 0.02)',
          'soft-xl': '0 25px 40px -10px rgba(0, 0, 0, 0.05), 0 15px 20px -10px rgba(0, 0, 0, 0.03)',
          'soft-2xl': '0 40px 60px -15px rgba(0, 0, 0, 0.06), 0 20px 30px -15px rgba(0, 0, 0, 0.04)',
          
          // Sombra interna para inputs (efeito de profundidade sutil)
          'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        keyframes: {
          "accordion-down": {
            from: { height: "0" },
            to: { height: "var(--radix-accordion-content-height)" },
          },
          "accordion-up": {
            from: { height: "var(--radix-accordion-content-height)" },
            to: { height: "0" },
          },
        },
        animation: {
          "accordion-down": "accordion-down 0.2s ease-out",
          "accordion-up": "accordion-up 0.2s ease-out",
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
  }
  
  export default config
