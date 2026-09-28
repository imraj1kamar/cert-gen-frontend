// app/layout.js
import "./globals.css";
import ReduxProvider from "@/components/providers/ReduxProvider";
import QueryProvider from "@/components/providers/QueryProvider";

export const metadata = {
  title: "Automated Certificate Generation System",
  description: "Enterprise high-volume certificate engine",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <ReduxProvider>
          <QueryProvider>
       
            {children}
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}