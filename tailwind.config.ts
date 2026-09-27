import type { Config } from "tailwindcss";

// Palette inspired by the Harappan world itself, not a generic default:
// fired clay seals, sandstone brick, and the lapis lazuli traded through
// the Indus valley.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bone: "#EDE6D6", // background — sun-bleached bone/clay
        ink: "#241E18", // primary text — burnt ink
        clay: "#A6432D", // seal-fire clay red, accent
        sandstone: "#C9A876", // secondary surfaces / cards
        lapis: "#28415F", // deep indigo, trade-route blue
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "serif"],
        body: ["ui-sans-serif", "system-ui", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
