// Cliente WebSocket do gateway de tempo real v2.
//
// Conexão: wss://realtime-v2.suporteleiloes.com?client=<clientId>&token=<loginHash>
// Subscribe: { event: 'subscribe', channel: 'leilao:{id}' }   ← channel no TOPO, separador ':'
// Eventos: lance, statusLote, statusLeilao, renovarCronometro, mudaLote, … (GUIA §9).
// O cliente só RECEBE; ações (enviar lance) são REST. Sem URL, vira no-op (caller faz polling).
//
// ⛔ NÃO use o gateway LEGADO (wss://realtime.suporteleiloes.com.br:8446). Ele é alimentado
//    pela API PHP 7.4 do stack antigo: conecta com sucesso e NUNCA entrega um evento.
'use client';

import { REALTIME_URL } from './config';

export interface RealtimeEvent {
  type: string;
  data: Record<string, unknown>;
  _client?: string;
}

export interface RealtimeHandle {
  close: () => void;
  enabled: boolean;
  /** Entra numa sala. Pode ser chamado a qualquer momento; re-emitido a cada reconexão. */
  subscribe: (channel: string) => void;
}

interface ConnectOpts {
  url?: string;        // de site/config.realtime.url; cai no env REALTIME_URL.
  loginHash?: string;
  /**
   * `realtime.clientId` de site/config. É o `_client` com que o gateway particiona o
   * fan-out: conectar com outro valor (ex.: window.location.hostname) entra na sala e
   * não recebe evento nenhum.
   */
  clientId?: string;
  /** Salas a assinar assim que abrir, ex.: ['leilao:123']. */
  channels?: string[];
  onEvent: (ev: RealtimeEvent) => void;
  onStatus?: (s: 'open' | 'closed' | 'error') => void;
}

/**
 * Monta o frame de subscribe do gateway v2.
 *
 * ⚠️ Três formas de errar isto e ter um socket que conecta, responde OK e entrega ZERO:
 *   1. aninhar em `data` → { event:'subscribe', data:{ channel } }   ❌
 *   2. usar hífen        → 'leilao-123'                              ❌
 *   3. usar o frame legado do comunicator → { type:'com/subscribe' } ❌
 * O certo é `channel` no topo, com `:`.
 */
export function frameSubscribe(channel: string): string {
  return JSON.stringify({ event: 'subscribe', channel });
}

export function connectRealtime({ url, loginHash, clientId, channels, onEvent, onStatus }: ConnectOpts): RealtimeHandle {
  const base = url || REALTIME_URL;
  if (!base) {
    return { close: () => {}, enabled: false, subscribe: () => {} };
  }
  let ws: WebSocket | null = null;
  let closedByUser = false;
  let retry: ReturnType<typeof setTimeout> | null = null;
  // Salas assinadas — re-emitidas após reconectar, senão o socket volta mudo.
  const salas = new Set<string>(channels ?? []);

  const enviarSubscribe = (channel: string) => {
    if (ws?.readyState === WebSocket.OPEN) ws.send(frameSubscribe(channel));
  };

  const open = () => {
    const qs = new URLSearchParams();
    if (clientId) qs.set('client', clientId);
    if (loginHash) qs.set('token', loginHash);
    ws = new WebSocket(`${base}?${qs.toString()}`);

    ws.onopen = () => {
      onStatus?.('open');
      salas.forEach(enviarSubscribe);
    };
    ws.onmessage = (msg) => {
      try {
        const ev = JSON.parse(msg.data);
        // O gateway responde { type:'joinRoom', roomId } ao subscribe e
        // { type:'error', message:'Payload inválido' } quando o frame está errado.
        if (ev?.type === 'error') {
          console.error('[realtime] frame rejeitado pelo gateway:', ev);
          return;
        }
        if (ev && ev.type) onEvent(ev as RealtimeEvent);
      } catch { /* ignora frames não-JSON */ }
    };
    ws.onerror = () => onStatus?.('error');
    ws.onclose = () => {
      onStatus?.('closed');
      if (!closedByUser) retry = setTimeout(open, 10_000); // reconexão automática
    };
  };

  open();

  return {
    enabled: true,
    subscribe: (channel: string) => {
      salas.add(channel);
      enviarSubscribe(channel);
    },
    close: () => {
      closedByUser = true;
      if (retry) clearTimeout(retry);
      ws?.close();
    },
  };
}

/**
 * Dedup de lances.
 *
 * O gateway entrega frames DUPLICADOS (o cliente costuma manter ~2 conexões). Sem dedup
 * por id, a lista de lances duplica visivelmente na tela. Use em qualquer handler de `lance`.
 */
export function criarDedup(maxIds = 200) {
  const vistos = new Set<number | string>();
  const ordem: (number | string)[] = [];
  return (id: number | string | null | undefined): boolean => {
    if (id === null || id === undefined) return true; // sem id, não dá pra deduplicar
    if (vistos.has(id)) return false;
    vistos.add(id);
    ordem.push(id);
    if (ordem.length > maxIds) {
      const antigo = ordem.shift();
      if (antigo !== undefined) vistos.delete(antigo);
    }
    return true;
  };
}
