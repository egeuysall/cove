import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "@/styles/globals.css";
import {Navbar} from "@/components/navbar";
import {Analytics} from "@vercel/analytics/next"
import {SpeedInsights} from "@vercel/speed-insights/next"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Cove",
    description: "Cove is a private social network for friends to share links, react, and comment in a minimal space.",
    icons: {
        icon: "/icon.ico",
    },
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}
        >
        <Analytics/>
        <Navbar/>
        <main className="bg-white">
            {children}
        </main>
        <SpeedInsights/>
        </body>
        </html>
    );
}
