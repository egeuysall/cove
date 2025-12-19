import {createServerClient} from "@supabase/ssr";
import {notFound} from "next/navigation";
import {cookies} from "next/headers";
import React from "react";
import {Group, Links} from "@/types/api";
import {CreateLink} from "@/components/create-link";
import {RealTimeLinks} from "@/components/real-time-links";

const DynamicGroups = async ({ params }: { params: Promise<{ id: string}> }) => {
    const { id } = await params;
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

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    if (!token) {
        console.error("No token found in cookies");
        return notFound();
    }

    try {
        const fetchedLinks = await fetch(`https://coveapi.egeuysal.com/v1/groups/${encodeURIComponent(id)}/links`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });


        if (!fetchedLinks.ok) {
            console.error(`Something went wrong. Try again.`);
            return notFound();
        }

        const json = await fetchedLinks.json();
        const links: Links[] = json.data as Links[];

        const res = await fetch(`https://coveapi.egeuysal.com/v1/groups/${encodeURIComponent(id)}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });


        if (!res.ok) {
            console.error(`Something went wrong. Try again.`);
            return notFound();
        }

        const groupData = await res.json();
        const group: Group = groupData.data as Group;

        const { data, error } = await supabase.auth.admin.getUserById(group.CreatedBy)

        if (error) {
            console.error(`Something went wrong. Try again.`);
        }

        return (
            <main className="flex flex-col items-center bg-white">
                <div className="w-[90vw] md:w-[92.5vw] lg:w-[95vw] py-24 flex flex-col gap-6">
                    <h1 className="md:w-3/4 lg:w-2/4 text-gray-800 text-2xl md:text-3xl lg:text-4xl font-bold mb-12">
                        {group.Name}
                        {" "}
                        <span className="text-sm md:text-base font-normal opacity-75">by {data?.user?.user_metadata?.name || data?.user?.user_metadata?.email}
                        </span>
                    </h1>
                    <RealTimeLinks initialLinks={links.slice().reverse()} groupId={id} />

                    {/* Create Link Form at bottom of page */}
                    <div className="mt-12">
                        <CreateLink groupId={id} />
                    </div>
                </div>
            </main>
        );
    } catch (error) {
        console.error("Failed to fetch groups", error);
        return notFound();
    }
}

export default DynamicGroups;