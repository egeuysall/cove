-- name: CreateGroup :one
INSERT INTO groups (name, created_by)
VALUES ($1, $2)
    RETURNING *;

-- name: GetGroupByID :one
SELECT * FROM groups
WHERE id = $1;

-- name: GetGroupsByUser :many
SELECT g.*
FROM groups g
         JOIN group_members gm ON gm.group_id = g.id
WHERE gm.user_id = $1
ORDER BY g.created_at DESC;

-- name: DeleteGroup :exec
DELETE FROM groups
WHERE id = $1 AND created_by = $2;
