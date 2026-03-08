import "./globals.css";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/AuthProvider";

export const metadata = {
  title: "VirtualBet — AI-Powered SportyBet Predictions",
  description:
    "Get instant AI predictions for SportyBet Instant Football. Gold, Platinum & Diamond packages with verified odds.",
  keywords: "sportybet, predictions, virtual football, betting tips, ai predictions, ghana",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#22262D",
                color: "#EEEFF1",
                border: "1px solid #343944",
                fontFamily: "'Barlow Condensed', sans-serif",
              },
              success: {
                iconTheme: { primary: "#0B9635", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#E31725", secondary: "#fff" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
