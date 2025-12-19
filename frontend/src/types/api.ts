export type Group = {
    ID: string
    Name: string
    CreatedBy: string
    CreatedAt: string
}

export type Links = {
    id: string
    user_id: string
    url: string
    title: string
    comment: string
    created_at: string
}

export type LinkResponse = {
    id: string
    group_id: string
    user_id: string
    url: string
    title?: string
    comment?: string
    created_at: string
}

// WebSocket message types
export type WebSocketMessageType = "link_created" | "link_updated" | "link_deleted"

export type WebSocketMessage = {
    type: WebSocketMessageType
    data: LinkResponse | { id: string }
}

export type SubscribeMessage = {
    type: "subscribe" | "unsubscribe"
    groupId: string
}