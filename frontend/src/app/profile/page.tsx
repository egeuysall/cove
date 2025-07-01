'use client';

import React, {useEffect, useState} from 'react';
import {createBrowserClient} from "@supabase/ssr";
import {ChaoticOrbit} from "ldrs/react";
import 'ldrs/react/ChaoticOrbit.css';
import {buttonClass} from "@/utils/styles";
import Avatar from "@/components/avatar";

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const Profile: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const getUser = async () => {
            const { data, error } = await supabase.auth.getUser();
            if (error) {
                console.error('Error fetching user:', error.message);
                setError(true);
            } else {
                setUser(data.user);
            }
            setLoading(false);
        };
        getUser();
    }, []);

    if (loading) {
        return (
            <main className="flex flex-col items-center bg-white">
                <div className="flex w-[90vw] md:w-[92.5vw] lg:w-[95vw] flex-col gap-6 items-center justify-center h-screen">
                    <ChaoticOrbit size="35" speed="1.5" color="#1F2937" />
                    <h1 className="text-gray-800 text-2xl md:text-3xl lg:text-4xl font-bold text-center">Loading...</h1>
                </div>
            </main>
        );
    }

    if (error || !user) {
        return (
            <main className="flex flex-col items-center bg-white">
                <div className="flex w-[90vw] md:w-[92.5vw] lg:w-[95vw] flex-col gap-6 items-center justify-center h-screen">
                    <h1 className="text-gray-800 text-2xl md:text-3xl lg:text-4xl font-bold text-center">No user is logged in.</h1>
                    <button
                        className={`${buttonClass} md:w-auto flex gap-2 items-center justify-center py-3 px-6 rounded-md hover:bg-gray-100 transition`}
                        onClick={() => (window.location.href = '/')}
                    >
                        Go Home
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="flex flex-col items-center bg-white">
            <div className="flex w-[90vw] md:w-[92.5vw] lg:w-[95vw] flex-col gap-6 items-center justify-center h-screen">
                <div className="flex flex-col items-center gap-4 w-full bg-gray-100 p-6 rounded-lg">
                    <Avatar avatarUrl={user.user_metadata.avatar_url} email={user.user_metadata.email} />
                    <section className="w-full flex flex-col gap-4 text-gray-800">
                        <div>
                            <p className="text-center font-bold text-xl lg:text-2xl">{user.user_metadata.name || 'No name set'}</p>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Username</h2>
                            <p className="text-base">@{user.user_metadata.user_name || 'No username'}</p>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Email</h2>
                            <p className="text-base break-words">{user.user_metadata.email || 'No email available'}</p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
};

export default Profile;
