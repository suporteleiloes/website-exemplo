import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';

/**
 * OpenNext (Cloudflare) — adapta este Next para rodar como Worker.
 * ISR/incremental cache em R2 (bucket NEXT_INC_CACHE_R2_BUCKET, ver wrangler.jsonc):
 * o Worker é stateless, então as páginas ISR (o cache que segura a carga da API) vivem
 * no R2 e são compartilhadas entre invocações/edges.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
