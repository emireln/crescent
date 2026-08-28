export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatRelativeTime(timestampSecs: number): string {
  if (!timestampSecs) return 'Desconhecido';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestampSecs;

  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `há ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  }
  if (diff < 2592000) {
    const weeks = Math.floor(diff / 604800);
    return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }

  const date = new Date(timestampSecs * 1000);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getStatusBadge(status: string): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'active':
      return { label: 'Ativo', bg: 'bg-zinc-800', text: 'text-zinc-100', border: '' };
    case 'on_hold':
      return { label: 'Em Espera', bg: 'bg-zinc-900', text: 'text-zinc-400', border: '' };
    case 'completed':
      return { label: 'Concluído', bg: 'bg-zinc-850', text: 'text-zinc-300', border: '' };
    case 'archived':
      return { label: 'Arquivado', bg: 'bg-zinc-950', text: 'text-zinc-500', border: '' };
    default:
      return { label: 'Ativo', bg: 'bg-zinc-800', text: 'text-zinc-100', border: '' };
  }
}

export function getTechColor(_tech: string): string {
  // Strictly monochromatic: solid dark flat background with crisp zinc text
  return 'bg-zinc-800 text-zinc-200';
}
