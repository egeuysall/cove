-- name: CreateLink :one
INSERT INTO links (group_id, user_id, url, title, comment)
VALUES ($1, $2, $3, $4, $5)
    RETURNING *;

-- name: GetLinksByGroup :many
SELECT * FROM links
WHERE group_id = $1
ORDER BY created_at DESC
    LIMIT $2 OFFSET $3;

-- name: GetLinkByID :one
SELECT * FROM links
WHERE id = $1;

-- name: DeleteLink :exec
DELETE FROM links
WHERE id = $1 AND user_id = $2;

-- name: UpdateLinkComment :exec
UPDATE links
SET comment = $1
WHERE id = $2 AND user_id = $3;
