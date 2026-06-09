// Cliente WebSocket do gateway de tempo real (lib `comunicator`).
// Conexão: wss://<REALTIME_URL>?token=<loginHash>&client=<clientId>
// Eventos recebidos: lance, statusLote, statusLeilao, renovarCronometro, mudaLote, etc. (GUIA §9).
// O cliente só RECEBE; ações (enviar lance) são REST. Se REALTIME_URL vazio, vira no-op (caller faz polling).
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
}

interface ConnectOpts {
  loginHash?: string;
  clientId?: string;
  onEvent: (ev: RealtimeEvent) => void;
  onStatus?: (s: 'open' | 'closed' | 'error') => void;
}

export function connectRealtime({ loginHash, clientId, onEvent, onStatus }: ConnectOpts): RealtimeHandle {
  if (!REALTIME_URL) {
    return { close: () => {}, enabled: false };
  }
  let ws: WebSocket | null = null;
  let closedByUser = false;
  let retry: ReturnType<typeof setTimeout> | null = null;

  const open = () => {
    const qs = new URLSearchParams();
    if (loginHash) qs.set('token', loginHash);
    if (clientId) qs.set('client', clientId);
    ws = new WebSocket(`${REALTIME_URL}?${qs.toString()}`);

    ws.onopen = () => {
      onStatus?.('open');
      // Subscribe ao tópico do tenant (socket é multi-tenant).
      if (clientId) ws?.send(JSON.stringify({ type: 'com/subscribe', data: { client: clientId } }));
    };
    ws.onmessage = (msg) => {
      try {
        const ev = JSON.parse(msg.data);
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
    close: () => {
      closedByUser = true;
      if (retry) clearTimeout(retry);
      ws?.close();
    },
  };
}
