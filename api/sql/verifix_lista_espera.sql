-- Lista de espera de Verifix (POST /verifix en api.77delta.com). La escribe solo la API con la clave de servicio.
create table if not exists public.verifix_lista_espera (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  email      text not null,
  empresa    text not null,
  tipo       text not null check (tipo in ('gestoria', 'empresa')),
  idioma     text not null default 'es' check (idioma in ('es', 'en')),
  origen     text,
  ip_hash    text
);

-- RLS activa y sin políticas: anon y authenticated no leen ni escriben. service_role la salta.
alter table public.verifix_lista_espera enable row level security;
revoke all on public.verifix_lista_espera from anon, authenticated, public;
