import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata = {
  title: "VirtualBet — AI-Powered SportyBet Predictions",
  description: "Get instant AI predictions for SportyBet Instant Football.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
