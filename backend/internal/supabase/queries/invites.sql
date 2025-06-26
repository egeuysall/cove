-- name: CreateInvite :one
INSERT INTO invites (code, group_id)
VALUES ($1, $2)
    RETURNING *;

-- name: GetInviteByCode :one
SELECT * FROM invites
WHERE code = $1;

-- name: MarkInviteAsUsed :exec
UPDATE invites
SET used_by = $1
WHERE code = $2;

-- name: GetUnusedInvite :one
SELECT * FROM invites
WHERE code = $1 AND used_by IS NULL;

-- name: GetInvitesByGroup :many
SELECT * FROM invites
WHERE group_id = $1
ORDER BY created_at DESC;
