// Deriva o maxAge (segundos) de um cookie a partir de um timestamp "Y-m-d H:i:s"
// que a API retorna (expires / refreshExpires). Assim o cookie respeita os TTLs
// configurados por tenant (GlobalConfig auth.*_token.ttl), sem hardcode no front.
export function maxAgeFromTimestamp(ts: string | undefined | null, fallbackSeconds: number): number {
  if (!ts) return fallbackSeconds;
  const d = new Date(String(ts).replace(' ', 'T')); // naive local time
  if (isNaN(d.getTime())) return fallbackSeconds;
  const secs = Math.floor((d.getTime() - Date.now()) / 1000);
  return secs > 60 ? secs : fallbackSeconds;
}
