"use client";

import React, {useState} from "react";
import Image from "next/image";
import {createBrowserClient} from "@supabase/ssr";
import {buttonClass} from "@/utils/styles";

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async () => {
        const {error} = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        } else {
            setError("");
            window.location.href = "/dashboard";
        }
    };

    const handleOAuthLogin = async (provider: "google" | "github") => {
        const {error} = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });

        if (error) {
            setError(error.message);
        }
    };

    return (
        <main className="flex flex-col items-center bg-white">
            <div className="w-[90vw] md:w-[92.5vw] lg:w-[95vw] py-24 flex flex-col items-center gap-4">
                <Image src="/logo.png" alt="Cove logo" width={96} height={96}/>
                <h1 className="md:w-3/4 lg:w-2/4 text-center text-gray-800 text-xl md:text-2xl lg:text-3xl font-bold">
                    Login
                </h1>

                <section className="grid w-full md:w-auto gap-3">
                    <button
                        onClick={() => handleOAuthLogin("google")}
                        className={`${buttonClass} flex gap-2 items-center justify-center py-3`}
                    >
                        <Image src="/google.svg" alt="Google logo" width={24} height={24}/>
                        Continue with Google
                    </button>

                    <button
                        onClick={() => handleOAuthLogin("github")}
                        className={`${buttonClass} flex gap-2 items-center justify-center py-3`}
                    >
                        <Image src="/github.svg" alt="GitHub logo" width={24} height={24}/>
                        Continue with GitHub
                    </button>
                </section>

                <p className="text-gray-800 opacity-50">or</p>

                <div className="grid w-full md:w-59 gap-3">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800"
                    />
                    <button onClick={handleLogin} className={buttonClass}>
                        Log in with Email
                    </button>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </div>
            </div>
        </main>
    );
};

export default Login;
