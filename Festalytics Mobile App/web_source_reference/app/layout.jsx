import "@/index.css";
import { Inter, DM_Sans } from "next/font/google";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: '--font-dm-sans',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']
});

export const metadata = {
  title: "Festalytics - Event Planning Made Easy",
  description: "Plan your perfect event with AI and discover the best venues.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body className={`${inter.className} ${dmSans.variable}`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
