import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

export function PostThumbnail({ postId, alt = '' }: { postId: number | string; alt?: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [postId]);

  if (failed) return <ImageOff aria-label="Imagem indisponível" />;
  return <img src={`/api/media/posts/${postId}`} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
