"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {addLinkToGroup} from "@/hooks/link-actions";

import {Send} from "lucide-react"
import {buttonClass} from "@/utils/styles";

interface CreateLinkFormProps {
    groupId: string;
}

export const CreateLink = ({ groupId }: CreateLinkFormProps) => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            // Basic URL validation
            if (!url.trim().startsWith("http")) {
                setError("Please enter a valid URL starting with http:// or https://");
                setIsSubmitting(false);
                return;
            }

            const result = await addLinkToGroup({
                group_id: groupId.trim(),
                url: url.trim(),
                title: title.trim(),
                comment: comment.trim()
            });

            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(true);
                // Reset form
                setUrl("");
                setTitle("");
                setComment("");
                // Refresh the page to show the new link
                router.refresh();
            }
        } catch (err) {
            setError("Failed to add link. Please try again.");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                    Link added successfully!
                </div>
            )}

            <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        id="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-b-0 border-neutral-200 rounded-t-lg"
                        placeholder="https://example.com"
                        required
                    />

                <div className="mb-2">
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-b-lg"
                        placeholder="Title"
                    />
                </div>

                <div className="flex gap-4">
                    <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg col-span-3"
                        placeholder="Comment"
                        rows={1}
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting || !url}
                        className={`${buttonClass} disabled:opacity-50 flex items-center justify-center !w-14 ${
                            isSubmitting || !url
                                ? "bg-blue-300 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {isSubmitting ? <Send className="animate-bounce"/> : <Send className="hover:opacity-75 transition duration-200"/>}
                    </button>
                </div>
            </form>
        </div>
    );
};