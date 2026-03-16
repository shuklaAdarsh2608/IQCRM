import "./globals.css";
import { Libre_Baskerville } from "next/font/google";
import { QueryProvider } from "../components/providers/QueryProvider";
import { ThemeProvider } from "../src/context/ThemeContext";

export const metadata = {
  title: "IQLead CRM Dashboard",
  description: "Enterprise-grade AI-powered CRM dashboard"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

// Libre Baskerville, bold by default
const libre = Libre_Baskerville({
  weight: ["700"],
  subsets: ["latin"],
  display: "swap"
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script to set initial theme before hydration to avoid flicker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var storageKey = "iqlead_theme";
                  var classDark = "dark";
                  var classLight = "light";
                  var d = document.documentElement;
                  var stored = window.localStorage.getItem(storageKey);
                  var theme = stored === "light" || stored === "dark"
                    ? stored
                    : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
                        ? "dark"
                        : "light");
                  d.classList.remove(classLight, classDark);
                  if (theme === "dark") {
                    d.classList.add(classDark);
                  } else {
                    d.classList.add(classLight);
                  }
                } catch (e) {
                  // fail silently
                }
              })();
            `
          }}
        />
      </head>
      <body className={`${libre.className} bg-background antialiased`}>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

