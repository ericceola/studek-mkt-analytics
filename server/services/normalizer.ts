export type NormalizedPost = {
  instagramPostId: string | null; shortcode: string | null; type: 'Video'|'Image'|'Sidecar'|'Reel'|'Other'; caption: string;
  postUrl: string | null; displayUrl: string | null; videoUrl: string | null; publishedAt: Date | null; duration: number | null;
  surface: 'Feed'|'Reel'|'Story'; paid: boolean; commentsDisabled: boolean; likes: number; comments: number; views: number; plays: number; hashtags: string[]; raw: unknown;
};
const n = (value: unknown) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
const text = (value: unknown) => typeof value === 'string' ? value : '';
const date = (value: unknown) => { const parsed = new Date(text(value)); return Number.isNaN(parsed.getTime()) ? null : parsed; };
export function normalizeUsername(value: string) {
  const raw = value.trim().toLowerCase();
  const match = raw.match(/instagram\.com\/([^/?#]+)/i);
  return (match?.[1] || raw).replace(/^@/, '').replace(/\/$/, '');
}
export function normalizePost(item: Record<string, unknown>): NormalizedPost {
  const caption = text(item.caption);
  const supplied = Array.isArray(item.hashtags) ? item.hashtags.map(String) : [];
  const extracted = [...caption.matchAll(/#([\p{L}\p{N}_.]+)/gu)].map(match => match[1]);
  const rawType = text(item.type).toLowerCase();
  const productType = text(item.productType).toLowerCase();
  const type = productType === 'clips' || rawType.includes('reel') ? 'Reel' : rawType.includes('sidecar') ? 'Sidecar' : rawType.includes('video') ? 'Video' : rawType.includes('image') ? 'Image' : 'Other';
  const inputUrl = text(item.inputUrl).toLowerCase();
  const surface = inputUrl.includes('/stories/') || rawType.includes('story') ? 'Story' : productType === 'clips' || type === 'Reel' ? 'Reel' : 'Feed';
  return { instagramPostId: text(item.id) || null, shortcode: text(item.shortCode || item.shortcode) || null, type, caption,
    postUrl: text(item.url) || null, displayUrl: text(item.displayUrl) || null, videoUrl: text(item.videoUrl) || null,
    publishedAt: date(item.timestamp || item.takenAtIso || (typeof item.takenAt === 'number' ? new Date(item.takenAt * 1000).toISOString() : null)), duration: item.videoDuration == null ? null : n(item.videoDuration),
    surface, paid: Boolean(item.isSponsored || item.isPaidPartnership || item.paidPartnership), commentsDisabled: Boolean(item.commentsDisabled || item.isCommentsDisabled),
    likes: n(item.likesCount), comments: n(item.commentsCount), views: n(item.videoViewCount),
    plays: n(item.videoPlayCount) || n(item.videoViewCount), hashtags: [...new Set([...supplied, ...extracted].map(x => x.replace(/^#/, '').toLowerCase()).filter(Boolean))], raw: item };
}
export function engagement(likes: number, comments: number, followers: number) {
  const count = likes + comments; return { count, rate: followers > 0 ? (count / followers) * 100 : 0 };
}
