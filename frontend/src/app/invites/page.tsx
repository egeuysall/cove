import React from "react";
import {Invites} from "@/components/invites"

const InvitesPage: React.FC = () => {
    return (
        <main className="flex flex-col items-center bg-white">
            <div className="flex w-[90vw] md:w-[92.5vw] lg:w-[95vw] flex-col gap-6 items-center justify-center h-screen">
                <Invites isMobile={true} />
            </div>
        </main>
    );
}

export default InvitesPage;