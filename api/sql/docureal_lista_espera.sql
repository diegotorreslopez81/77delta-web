-- Peticiones de demo de DocuReal (POST /docureal en api.77delta.com). La escribe solo la API con la clave de servicio.
create table if not exists public.docureal_lista_espera (
  id                 bigint generated always as identity primary key,
  created_at         timestamptz not null default now(),
  email              text not null,
  empresa            text not null,
  tipo               text not null check (tipo in ('agencia', 'administrador', 'aseguradora', 'otro')),
  idioma             text not null default 'es' check (idioma in ('es', 'en', 'ca')),
  candidaturas_mes   text not null default '' check (candidaturas_mes in ('', 'menos-5', '5-20', '21-50', 'mas-50')),
  ya_me_paso         boolean not null default false,
  preferencia_precio text not null default 'no-se' check (preferencia_precio in ('49-mes', 'por-verificacion', 'no-se')),
  comentario         text not null default '',
  origen             text,
  ip_hash            text
);

-- El alta hace PATCH por email y luego POST: el email debe ser unico (en minusculas, la API ya lo normaliza).
create unique index if not exists docureal_lista_espera_email_key on public.docureal_lista_espera (email);

-- RLS activa y sin políticas: anon y authenticated no leen ni escriben. service_role la salta.
alter table public.docureal_lista_espera enable row level security;
revoke all on public.docureal_lista_espera from anon, authenticated, public;
