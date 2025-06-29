"use client";

import React, {useEffect, useRef, useState} from "react";
import Link from "next/link";
import {BadgePlus, LogOut, User} from "lucide-react";
import {createBrowserClient} from "@supabase/ssr";

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const ProfilePhoto: React.FC = () => {
    const [emailInitial, setEmailInitial] = useState("U");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [userName, setUserName] = useState("User");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const {data, error} = await supabase.auth.getUser();

            if (error) {
                console.error("Failed to fetch user:", error.message);
                return;
            }

            const user = data.user;

            if (user?.email) {
                setEmailInitial(user.email.charAt(0).toUpperCase());
            }

            if (user?.user_metadata?.avatar_url) {
                setAvatarUrl(user.user_metadata.avatar_url);
            }

            if (user?.user_metadata?.name) {
                setUserName(user.user_metadata.name);
            }
        };

        fetchUser();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <div
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border border-neutral-200 bg-white text-gray-800 font-bold cursor-pointer hover:bg-gray-200 transition duration-200"
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={`${userName}'s profile photo`}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarUrl(null)}
                    />
                ) : (
                    <span>{emailInitial || "U"}</span>
                )}
            </div>

            {isMenuOpen && (
                <div
                    className="absolute right-0 top-12 w-40 rounded-lg bg-white/90 border border-neutral-200 backdrop-blur-lg overflow-hidden"
                >
                    <Link
                        href="/profile"
                        className="w-full px-4 py-3 text-gray-800 hover:bg-gray-800/10 transition-colors flex items-center gap-3"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <User size={16}/>
                        Profile
                    </Link>

                    <Link
                        href="/signup"
                        className="w-full px-4 py-3 text-gray-800 hover:bg-gray-800/10 transition-colors flex items-center gap-3"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <BadgePlus size={16}/>
                        Signup
                    </Link>

                    <div className="h-px bg-white/20"/>

                    <Link
                        href="/signout"
                        className="w-full px-4 py-3 text-gray-800 hover:bg-gray-800/10 transition-colors flex items-center gap-3"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <LogOut size={16}/>
                        Sign out
                    </Link>
                </div>
            )}
        </div>
    );
};
