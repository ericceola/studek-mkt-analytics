import { describe, expect, it } from 'vitest';
import { isAllowedInstagramMediaUrl } from '../server/services/mediaCache.js';

describe('cache de imagens', () => {
  it('aceita somente HTTPS dos domínios de mídia do Instagram', () => {
    expect(isAllowedInstagramMediaUrl('https://scontent-mxp2-1.cdninstagram.com/image.jpg')).toBe(true);
    expect(isAllowedInstagramMediaUrl('https://instagram.fmad1-1.fna.fbcdn.net/image.jpg')).toBe(true);
    expect(isAllowedInstagramMediaUrl('http://scontent-mxp2-1.cdninstagram.com/image.jpg')).toBe(false);
    expect(isAllowedInstagramMediaUrl('https://cdninstagram.com.example.com/image.jpg')).toBe(false);
    expect(isAllowedInstagramMediaUrl('https://example.com/image.jpg')).toBe(false);
  });
});
