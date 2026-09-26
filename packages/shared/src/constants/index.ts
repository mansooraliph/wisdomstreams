export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_TAGS = 500;

export const VIDEO_VISIBILITY = ["PUBLIC", "UNLISTED", "PRIVATE", "SCHEDULED"] as const;
export const USER_ROLES = ["VIEWER", "CREATOR", "MODERATOR", "ADMIN"] as const;
export const NOTIFY_LEVELS = ["ALL", "PERSONALIZED", "NONE"] as const;
