import {createServerClient} from "@supabase/ssr";
import {notFound} from "next/navigation";
import {Group} from "@/types/api";
import {cookies} from "next/headers";
import React from "react";

const DynamicGroups = async ({ params }: { params: Promise<{ id: string}> }) => {
    const { id } = await params;
    const cookieStore = await cookies();

    // Create Supabase client with proper cookie handling
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    if (!token) {
        console.error("No token found in cookies");
        return notFound();
    }

    try {
        const res = await fetch(`http://localhost:8080/v1/groups/${encodeURIComponent(id)}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });


        if (!res.ok) {
            console.error(`API Error: ${res.status} ${res.statusText}`);
            return notFound();
        }

        const json = await res.json();
        const group: Group = json.data as Group;
        console.log(group);

        return (
            <main className="flex flex-col items-center bg-white">
                <div className="w-[90vw] md:w-[92.5vw] lg:w-[95vw] py-24 flex flex-col items-center justify-center gap-6">
                    <h1 className="md:w-3/4 lg:w-2/4 text-gray-800 text-2xl md:text-3xl lg:text-4xl font-bold text-center">{group.Name}</h1>
                </div>
            </main>
        );
    } catch (error) {
        console.error("Failed to fetch groups", error);
        return notFound();
    }
}

export default DynamicGroups;