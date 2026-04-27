/** Semantic tones for the in-app notification preview (aligned with common design-system naming). */
export const NOTIFICATION_SEMANTIC_COLORS = ["primary", "dark", "error", "warning", "success"];

/** Maps semantic names to Mantine `Notification` `color` prop (default theme palette). */
export function notificationSemanticToMantineColor(semantic) {
  switch (String(semantic || "").toLowerCase()) {
    case "primary":
      return "blue";
    case "error":
      return "red";
    case "warning":
      return "yellow";
    case "success":
      return "green";
    case "dark":
      return "dark";
    default:
      return "blue";
  }
}
