-- Script de inicialización de Base de Datos para Casino de Oficiales

-- 1. Crear tabla 'usuarios'
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    jerarquia TEXT,
    "nombreApellido" TEXT,
    dni TEXT,
    ce TEXT,
    "fechaNacimiento" TEXT,
    edad INTEGER,
    telefono TEXT,
    "fechaRegistro" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Crear tabla 'planilla_mensual'
CREATE TABLE IF NOT EXISTS public.planilla_mensual (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    socio TEXT,
    jerarquia TEXT,
    "Ene" TEXT,
    "Feb" TEXT,
    "Mar" TEXT,
    "Abr" TEXT,
    "May" TEXT,
    "Jun" TEXT,
    "Jul" TEXT,
    "Ago" TEXT,
    "Sep" TEXT,
    "Oct" TEXT,
    "Nov" TEXT,
    "Dic" TEXT
);

-- 3. Crear tabla 'propuestas'
CREATE TABLE IF NOT EXISTS public.propuestas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mi TEXT,
    ce TEXT,
    propuesta TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    jerarquia TEXT,
    nombre TEXT
);

-- 4. Crear tabla 'galeria'
CREATE TABLE IF NOT EXISTS public.galeria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    descripcion TEXT,
    url TEXT,
    "fileName" TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Crear tabla 'documentacion'
CREATE TABLE IF NOT EXISTS public.documentacion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT,
    url TEXT,
    "fileName" TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Crear tabla 'balance'
CREATE TABLE IF NOT EXISTS public.balance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    concepto TEXT,
    haber NUMERIC DEFAULT 0,
    debe NUMERIC DEFAULT 0,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- CONFIGURACIÓN DE SEGURIDAD (RLS - Row Level Security)
-- -----------------------------------------------------------------------------
-- Por defecto Supabase bloquea las lecturas/escrituras.
-- Estos comandos habilitan el acceso público total para permitir que la aplicación funcione
-- de la misma forma que estaba en Firebase.

-- Habilitar RLS en todas las tablas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planilla_mensual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso total (All access)
CREATE POLICY "Permitir todo a anon en usuarios" ON public.usuarios FOR ALL USING (true);
CREATE POLICY "Permitir todo a anon en planilla_mensual" ON public.planilla_mensual FOR ALL USING (true);
CREATE POLICY "Permitir todo a anon en propuestas" ON public.propuestas FOR ALL USING (true);
CREATE POLICY "Permitir todo a anon en galeria" ON public.galeria FOR ALL USING (true);
CREATE POLICY "Permitir todo a anon en documentacion" ON public.documentacion FOR ALL USING (true);
CREATE POLICY "Permitir todo a anon en balance" ON public.balance FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- CREACIÓN DE BUCKETS (STORAGE)
-- -----------------------------------------------------------------------------
-- Insertar los buckets necesarios para Storage y hacerlos públicos
INSERT INTO storage.buckets (id, name, public) VALUES ('galeria', 'galeria', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documentacion', 'documentacion', true) ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para acceso público a archivos
CREATE POLICY "Acceso público de lectura a galeria" ON storage.objects FOR SELECT USING (bucket_id = 'galeria');
CREATE POLICY "Acceso público de escritura a galeria" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'galeria');
CREATE POLICY "Acceso público de borrado a galeria" ON storage.objects FOR DELETE USING (bucket_id = 'galeria');

CREATE POLICY "Acceso público de lectura a documentacion" ON storage.objects FOR SELECT USING (bucket_id = 'documentacion');
CREATE POLICY "Acceso público de escritura a documentacion" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documentacion');
CREATE POLICY "Acceso público de borrado a documentacion" ON storage.objects FOR DELETE USING (bucket_id = 'documentacion');
