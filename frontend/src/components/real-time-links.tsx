"use client";

import { useState, useEffect } from "react";
import { Links } from "@/types/api";
import { LinkCard } from "@/components/link-card";
import { useWebSocket } from "@/hooks/useWebSocket";

interface RealTimeLinksProps {
  initialLinks: Links[];
  groupId: string;
}

export function RealTimeLinks({ initialLinks, groupId }: RealTimeLinksProps) {
  const [links, setLinks] = useState<Links[]>(initialLinks);
  const { status, lastMessage } = useWebSocket(groupId);

  useEffect(() => {
    if (!lastMessage) return;

    console.log("Received WebSocket message:", lastMessage);

    switch (lastMessage.type) {
      case "link_created": {
        const newLink = lastMessage.data as any;
        // Convert backend format to frontend format
        const formattedLink: Links = {
          id: newLink.id,
          user_id: newLink.user_id,
          url: newLink.url,
          title: newLink.title || "",
          comment: newLink.comment || "",
          created_at: newLink.created_at,
        };
        setLinks((prev) => [formattedLink, ...prev]);
        break;
      }

      case "link_updated": {
        const updatedLink = lastMessage.data as any;
        setLinks((prev) =>
          prev.map((link) =>
            link.id === updatedLink.id
              ? {
                  ...link,
                  comment: updatedLink.comment || "",
                  title: updatedLink.title || "",
                }
              : link
          )
        );
        break;
      }

      case "link_deleted": {
        const deletedData = lastMessage.data as { id: string };
        setLinks((prev) => prev.filter((link) => link.id !== deletedData.id));
        break;
      }
    }
  }, [lastMessage]);

  return (
    <>
      {status === "connected" && (
        <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
          Real-time updates enabled
        </div>
      )}
      {status === "connecting" && (
        <div className="mb-4 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
          Connecting to real-time updates...
        </div>
      )}
      {status === "error" && (
        <div className="mb-4 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm">
          Real-time updates unavailable
        </div>
      )}

      {links.length > 0 ? (
        links.map((link: Links) => (
          <LinkCard
            key={link.id}
            id={link.id}
            user_id={link.user_id}
            url={link.url}
            created_at={link.created_at}
            title={link.title}
            comment={link.comment}
          />
        ))
      ) : (
        <div className="text-gray-500 text-center py-8">
          No links found. Add a link below.
        </div>
      )}
    </>
  );
}
