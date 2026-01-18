import { GeneratedPost } from "@/lib/types";

/**
 * Export posts to CSV for scheduling tools
 */
export function exportPostsToCSV(posts: GeneratedPost[]): void {
  const headers = [
    "Date",
    "Time",
    "Platform",
    "Content",
    "Quality Score",
    "Voice Profile",
    "Created At",
  ];

  const rows = posts.map(post => [
    "", // Date (empty for manual scheduling)
    "", // Time (empty)
    "LinkedIn",
    escapeCSV(post.outputs.linkedin.post),
    post.quality.score.toString(),
    post.voiceProfile.name,
    new Date(post.createdAt).toLocaleDateString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(",")),
  ].join("\n");

  // Add BOM for Excel compatibility
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `william_posts_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export a single post to CSV
 */
export function exportSinglePostToCSV(post: GeneratedPost): void {
  exportPostsToCSV([post]);
}

/**
 * Escape CSV field properly
 */
function escapeCSV(field: string): string {
  // If field contains comma, newline, or quote, wrap in quotes
  if (field.includes(",") || field.includes("\n") || field.includes('"')) {
    // Escape quotes by doubling them
    const escaped = field.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return field;
}

/**
 * Export posts to JSON for backup
 */
export function exportPostsToJSON(posts: GeneratedPost[]): void {
  const json = JSON.stringify(posts, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `william_posts_backup_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export posts to CSV with custom filename
 */
export function exportToCSV(posts: GeneratedPost[], filename: string): void {
  const getContent = (post: GeneratedPost): string => {
    return post.outputs?.linkedin?.post || post.pipeline?.finalVersion || "";
  };

  const getScore = (post: GeneratedPost): number => {
    return post.quality?.score || 0;
  };

  const headers = ["Content", "Quality Score", "Created At", "Platform"];
  const rows = posts.map(post => [
    escapeCSV(getContent(post)),
    getScore(post).toString(),
    new Date(post.createdAt).toLocaleDateString(),
    "LinkedIn",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(",")),
  ].join("\n");

  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export posts to JSON with custom filename
 */
export function exportToJSON(posts: GeneratedPost[], filename: string): void {
  const json = JSON.stringify(posts, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
