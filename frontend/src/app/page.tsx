import React from "react"
import Link from "next/link"
import Image from "next/image"

import {buttonClass} from "@/utils/styles";

const Home: React.FC = () => {
    return (
        <main className="flex flex-col items-center bg-white">
            <div className="w-[90vw] md:w-[92.5vw] lg:w-[95vw] py-24 flex flex-col gap-6">
                <section>
                    <h1 className="md:w-3/4 lg:w-2/4 text-gray-800 text-2xl md:text-3xl lg:text-4xl font-bold">
                        Cove
                    </h1>
                    <p className="md:w-3/4 lg:2/4 text-gray-800">
                        Cove is a private social network for friends to share links, react, and comment in a minimal
                        space.

                    </p>
                </section>
                <section className="flex flex-col md:grid md:grid-cols-2 gap-3">
                    <Link href="/signup">
                        <button
                            className={buttonClass}>
                            Sign up
                        </button>
                    </Link>
                    <Link href="/login">
                        <button
                            className={buttonClass}>
                            Log in
                        </button>
                    </Link>
                </section>
                <section>
                    <Image
                        src="/workspace.jpg"
                        width={2048}
                        height={1316}
                        alt="Workspace image"
                        className="rounded-lg aspect-square lg:aspect-video object-cover w-full hover:opacity-75 transition duration-200"
                    />
                </section>
            </div>
        </main>
    );
}

export default Home