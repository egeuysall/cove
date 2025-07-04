"use client";

import {useEffect, useRef, useState} from "react";
import {createBrowserClient} from "@supabase/ssr";
import {buttonClass} from "@/utils/styles";

// Define API response types
interface InviteResponse {
    code: string;
    groupId: string;
    createdAt: string;
    usedBy?: string;
}

interface Group {
    ID: string;
    Name: string;
}

interface InvitesProps {
    isMobile?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

export const Invites: React.FC<InvitesProps> = ({ isMobile }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [invites, setInvites] = useState<InviteResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Close dropdown when clicking outside (desktop only)
    useEffect(() => {
        if (isMobile) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMobile]);

    // Load groups when dropdown opens (desktop) or on mount (mobile)
    useEffect(() => {
        if (isMobile) {
            fetchGroups();
        } else if (isOpen) {
            fetchGroups();
        }
    }, [isOpen, isMobile]);

    // Auth header helper
    const getAuthHeader = async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error("Not authenticated");
        }

        return {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
        };
    };

    // Fetch groups
    const fetchGroups = async () => {
        try {
            const headers = await getAuthHeader();
            const response = await fetch(`${API_BASE_URL}/groups`, { headers });

            if (response.ok) {
                const data = await response.json();
                setGroups(data.data);
            } else {
                const errorData = await response.json();
                setError("Failed to load groups. Please try again.");
            }
        } catch (err) {
            if (err instanceof Error && err.message === "Not authenticated") {
                setError("Please sign in to continue");
            } else {
                setError("Failed to load groups. Please try again.");
            }
        }
    };

    // Create invite
    const createInvite = async () => {
        if (!selectedGroupId) return;

        setIsLoading(true);
        setError("");
        setMessage("");

        try {
            const headers = await getAuthHeader();
            const response = await fetch(`${API_BASE_URL}/invites`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    group_id: selectedGroupId,
                }),
            });

            let data = await response.json();
            data = data.data;

            if (!response.ok) {
                throw new Error(data.message || "Error creating invite");
            }

            setMessage(`Invite created! Code: ${data.code}`);
            fetchInvites(selectedGroupId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create invite");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch invites for group
    const fetchInvites = async (groupId: string) => {
        setSelectedGroupId(groupId);
        setIsLoading(true);
        setError("");

        try {
            const headers = await getAuthHeader();
            const response = await fetch(`${API_BASE_URL}/groups/${groupId}/invites`, {
                headers,
            });

            let data = await response.json();
            data = data.data;

            if (!response.ok) {
                throw new Error(data.message || "Error fetching invites");
            }

            setInvites(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch invites");
        } finally {
            setIsLoading(false);
        }
    };

    // Accept invite
    const acceptInvite = async () => {
        if (!inviteCode) return;

        setIsLoading(true);
        setError("");
        setMessage("");

        try {
            const headers = await getAuthHeader();
            const response = await fetch(`${API_BASE_URL}/invites/${inviteCode}/accept`, {
                method: "POST",
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error accepting invite");
            }

            setMessage("Successfully joined the group!");
            setInviteCode("");
            fetchGroups();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to accept invite");
        } finally {
            setIsLoading(false);
        }
    };

    // Copy invite link
    const copyInviteLink = (code: string) => {
        navigator.clipboard
            .writeText(code)
            .then(() => {
                setMessage("Invite link copied to clipboard");
                setTimeout(() => setMessage(""), 3000);
            })
            .catch(() => {
                setError("Failed to copy link to clipboard");
            });
    };

    // Extracted menu JSX to avoid duplication
    const renderMenuContent = () => (
        <>
            {error && (
                <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>
            )}

            {message && (
                <div className="bg-green-100 text-green-700 p-2 rounded mb-3 text-sm">{message}</div>
            )}

            {/* Create invite */}
            <div className="mb-4">
                <h3 className="font-bold text-sm mb-2">Create Invite</h3>
                <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full p-1.5 border border-neutral-200 rounded-lg text-sm mb-2"
                >
                    <option value="">Select a group</option>
                    {groups.map((group) => (
                        <option key={group.ID} value={group.ID}>
                            {group.Name}
                        </option>
                    ))}
                </select>
                <button
                    onClick={createInvite}
                    disabled={!selectedGroupId || isLoading}
                    className={`${buttonClass} disabled:opacity-50 text-sm p-2`}
                >
                    {isLoading ? "Creating..." : "Create Invite"}
                </button>
            </div>

            <hr className="my-3 border border-neutral-200" />

            {/* Accept invite */}
            <div className="mb-4">
                <h3 className="font-bold text-sm mb-2">Accept Invite</h3>
                <div className="grid grid-cols-4 gap-2">
                    <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Enter invite code"
                        className="flex-1 p-1.5 border border-neutral-200 rounded-lg text-sm col-span-3"
                    />
                    <button
                        onClick={acceptInvite}
                        disabled={!inviteCode || isLoading}
                        className={`${buttonClass} disabled:opacity-50 text-sm p-2 flex items-center justify-center`}
                    >
                        Join
                    </button>
                </div>
            </div>

            {/* Invites list for selected group */}
            {selectedGroupId && (
                <>
                    <hr className="my-3" />
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium text-sm">Group Invites</h3>
                            <button
                                onClick={() => fetchInvites(selectedGroupId)}
                                className="text-xs text-blue-600"
                            >
                                Refresh
                            </button>
                        </div>

                        {isLoading ? (
                            <p className="text-sm text-gray-500">Loading...</p>
                        ) : invites.length > 0 ? (
                            <div className="max-h-40 overflow-y-auto">
                                {invites.map((invite) => (
                                    <div key={invite.code} className="border-b py-2 last:border-b-0">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium">{invite.code}</span>
                                            <span
                                                className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                    invite.usedBy ? "bg-gray-200" : "bg-green-100 text-green-800"
                                                }`}
                                            >
                        {invite.usedBy ? "Used" : "Active"}
                      </span>
                                        </div>
                                        {!invite.usedBy && (
                                            <button
                                                onClick={() => copyInviteLink(invite.code)}
                                                className="text-xs text-blue-600 mt-1"
                                            >
                                                Copy Link
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No invites found</p>
                        )}
                    </div>
                </>
            )}
        </>
    );

    return (
        <div className="relative" ref={dropdownRef}>
            {isMobile ? (
                // Mobile: always show menu inline without toggle button
                <div className="w-72 bg-white/90 backdrop-blur-lg border border-neutral-200 rounded-lg z-12 p-4">
                    {renderMenuContent()}
                </div>
            ) : (
                <>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-sm font-bold text-gray-800 hover:opacity-75 transition duration-200 transition ease-in-out duration-200"
                    >
                        <span>Invites</span>
                    </button>

                    {isOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur-lg border border-neutral-200 rounded-lg z-12 p-4">
                            {renderMenuContent()}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
