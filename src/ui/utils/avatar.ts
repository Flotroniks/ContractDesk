const AVATAR_PALETTE = [
    "#2563EB",
    "#6366F1",
    "#EA580C",
    "#16A34A",
    "#DB2777",
    "#0891B2",
    "#7C3AED",
];

export type AvatarData = {
    initials: string;
    color: string;
};

export function buildAvatar(username: string): AvatarData {
    const initials = username
        .split(" ")
        .filter(Boolean)
        .map(part => part[0]?.toUpperCase())
        .join("")
        .slice(0, 2);

    const seed = username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = AVATAR_PALETTE[seed % AVATAR_PALETTE.length];

    return { initials: initials || "?", color };
}
