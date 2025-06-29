"use client";

import React, {useEffect} from "react";
import {createBrowserClient} from "@supabase/ssr";
import {useRouter} from "next/navigation";

import {ChaoticOrbit} from 'ldrs/react';
import 'ldrs/react/ChaoticOrbit.css';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SignOut: React.FC = () => {
    const router = useRouter();

    useEffect(() => {
        const signOutUser = async () => {
            await supabase.auth.signOut();
            router.push("/");
        };

        signOutUser();
    }, [router]);

    return (
        <main className="flex flex-col gap-6 items-center justify-center h-screen text-gray-800">
            <ChaoticOrbit size="35" speed="1.5" color="#1F2937"/>
            <p>Signing out...</p>
        </main>
    );
};

export default SignOut;
