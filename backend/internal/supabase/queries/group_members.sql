-- name: AddUserToGroup :exec
INSERT INTO group_members (user_id, group_id)
VALUES ($1, $2)
    ON CONFLICT DO NOTHING;

-- name: GetGroupsForUser :many
SELECT group_id FROM group_members
WHERE user_id = $1;

-- name: GetGroupMembers :many
SELECT user_id FROM group_members
WHERE group_id = $1;

-- name: IsUserInGroup :one
SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = $1 AND user_id = $2
) AS exists;
