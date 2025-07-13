import React from "react";

import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";

import type {Links} from "@/types/api"
import Link from "next/link";
import Avatar from "@/components/avatar"

export const LinkCard = async ({ user_id, url, title, comment, created_at }: Links) => {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: { path?: string }) {
                    cookieStore.set(name, value, options);
                },
                remove(name: string, options: { path?: string }) {
                    cookieStore.set(name, "", { ...options, maxAge: 0 });
                },
            },
        }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error("Something went wrong:", error);
    }

    const isMe = user?.id === user_id;

    let avatarUrl = "";
    let email = "";

    if (isMe) {
        avatarUrl = user?.user_metadata?.avatar_url ?? "";
        email = user?.email ?? "";
    } else {
        const { data: fetchedUser, error } = await supabase.auth.admin.getUserById(user_id);

        if (error) {
            console.error("Something went wrong:", error);
        }

        avatarUrl = fetchedUser?.user?.user_metadata?.avatar_url ?? "";
        email = fetchedUser?.user?.email ?? "";
    }

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const formatted = formatDate(created_at);

    return (
        <>
            <p className="text-center opacity-50 text-sm md:text-base">{formatted}</p>
            <section className={`flex items-center gap-2 ${isMe ? "self-end" : "self-start"}`}>
                {!isMe && <Avatar avatarUrl={avatarUrl} email={email} />}
                <Link href={url} passHref>
                <div className={`flex flex-col gap-1 border p-2 border-neutral-200 rounded-lg w-fit ${isMe ? "bg-teal-700 text-white" : "bg-neutral-300 text-gray-800"}`}>
                    <h3 className="underline hover:opacity-75 transition duration-200">{title}</h3>
                    <p className="text-sm opacity-75">{comment}</p>
                </div>
                </Link>
                {isMe && <Avatar avatarUrl={avatarUrl} email={email} className="!w-13 !h-13"/>}
            </section>
        </>
    );
};
