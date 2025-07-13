"use server";

import {cookies} from "next/headers";
import {createServerClient} from "@supabase/ssr";

interface LinkData {
    group_id: string;
    url: string;
    title?: string;
    comment?: string;
}

export async function addLinkToGroup(linkData: LinkData) {
    const cookieStore = await cookies();

    // Create Supabase client
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

    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
        return { error: "You must be logged in to add links" };
    }

    try {
        const response = await fetch(`https://coveapi.egeuysal.com/v1/links`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(linkData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            return {
                error: errorData?.message || `Failed to add link (${response.status})`
            };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error("Error adding link:", error);
        return { error: "Failed to connect to the server. Please try again." };
    }
}