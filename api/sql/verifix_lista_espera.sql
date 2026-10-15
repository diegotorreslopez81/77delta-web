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

-- Migración: columna ya_me_ha_pasado (el alta indica si ya sufrió un fraude de pago). Idempotente.
alter table public.verifix_lista_espera add column if not exists ya_me_ha_pasado boolean not null default false;

-- Migración: columna programa (programa contable o ERP que usa, texto libre, máx 40). Idempotente.
alter table public.verifix_lista_espera add column if not exists programa text;

-- Migración: idioma admite 'ca' (landing en catalán). Idempotente.
alter table verifix_lista_espera drop constraint if exists verifix_lista_espera_idioma_check;
alter table verifix_lista_espera add constraint verifix_lista_espera_idioma_check check (idioma in ('es', 'en', 'ca'));
