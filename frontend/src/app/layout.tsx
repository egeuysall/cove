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
    title: "Present: Plan. Track. Gift.",
    description: "Present helps you organize, track, and share gift lists with ease. Stay on budget and never miss a gift. Start managing your gifts today!",
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
        {children}
        <SpeedInsights/>
        </body>
        </html>
    );
}
