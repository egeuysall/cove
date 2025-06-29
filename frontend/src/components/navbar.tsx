"use client";

import React, {useState} from "react";
import {Menu, X} from "lucide-react";
import Link from "next/link";
import {ProfilePhoto} from "./profile-photo";
import Image from "next/image";

const desktopNavItems = [
    {label: "Home", href: "/"},
    {label: "Groups", href: "/groups"},
    {label: "Invites", href: "/invites"},
    {label: "Login", href: "/login"},
];

const mobileNavItems = [
    {label: "Home", href: "/"},
    {label: "Groups", href: "/groups"},
    {label: "Invites", href: "/invites"},
    {label: "Profile", href: "/profile"},
    {label: "Login", href: "/login"},
    {label: "Logout", href: "/logout"},
];

export const Navbar: React.FC = () => {
    const [open, setOpen] = useState(false);

    return (
        <header className="w-full flex justify-center">
            <nav
                className="fixed top-4 w-[90vw] md:w-[92.5vw] lg:w-[95vw] z-10 backdrop-blur-lg bg-white/50 border border-neutral-200 rounded-lg px-4 py-2.5 flex items-center justify-between"
            >
                <Link
                    href="/"
                    className="font-bold text-gray-800 flex items-center gap-2 hover:opacity-75 duration-200 transition"
                >
                    <Image width={32} height={32} src="/logo.png" alt="Cove logo"/>
                    <span className="hidden md:flex">Cove</span>
                </Link>

                <ul className="hidden md:flex items-center gap-6">
                    {desktopNavItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className="text-sm font-semibold text-gray-800 hover:opacity-75 transition"
                            >
                                {item.label}
                            </Link>
                        </li>
                    ))}
                    <ProfilePhoto/>
                </ul>

                {/* Mobile menu button */}
                <button
                    className="md:hidden text-gray-800"
                    onClick={() => setOpen((prev) => !prev)}
                    aria-label="Toggle menu"
                >
                    {open ? <X size={24}/> : <Menu size={24}/>}
                </button>

                {/* Mobile dropdown with extra items */}
                {open && (
                    <ul
                        className="absolute top-full right-4 mt-2 backdrop-blur-lg bg-white/90 border border-neutral-200 rounded-lg p-4 flex flex-col gap-3 w-48 md:hidden"
                    >
                        {mobileNavItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className="text-sm font-semibold text-gray-800 hover:opacity-80 transition"
                                    onClick={() => setOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </nav>
        </header>
    );
};
