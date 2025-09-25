import GoogleBusinessOptimizerEmbed from './GoogleBusinessOptimizerEmbed';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function resolveAllowedOrigins(): string[] {
  const raw = process.env.EMBED_ALLOWED_ORIGINS ?? '';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export default function GoogleBusinessOptimizerPage() {
  const allowedOrigins = resolveAllowedOrigins();

  return (
    <GoogleBusinessOptimizerEmbed allowedOrigins={allowedOrigins} />
  );
}
