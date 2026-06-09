-- =============================================================================
-- SCRIPT PARA REVERTIR LA SEGURIDAD DE SUPABASE AL ESTADO ORIGINAL PÚBLICO
-- =============================================================================

-- 1. ELIMINAR LAS POLÍTICAS SEGURAS RECIENTES DE TABLAS PÚBLICAS
DROP POLICY IF EXISTS "Lectura autenticada usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Edicion propia o admin usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Borrado solo admin usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Insercion autenticada usuarios" ON public.usuarios;

DROP POLICY IF EXISTS "Lectura autenticada planilla" ON public.planilla_mensual;
DROP POLICY IF EXISTS "Escritura solo admin planilla" ON public.planilla_mensual;
DROP POLICY IF EXISTS "Insercion usuarios nuevos" ON public.planilla_mensual;

DROP POLICY IF EXISTS "Lectura autenticada propuestas" ON public.propuestas;
DROP POLICY IF EXISTS "Insercion autenticada propuestas" ON public.propuestas;
DROP POLICY IF EXISTS "Borrado solo admin propuestas" ON public.propuestas;

DROP POLICY IF EXISTS "Lectura autenticada galeria" ON public.galeria;
DROP POLICY IF EXISTS "Escritura solo admin galeria" ON public.galeria;

DROP POLICY IF EXISTS "Lectura autenticada documentacion" ON public.documentacion;
DROP POLICY IF EXISTS "Escritura solo admin documentacion" ON public.documentacion;

DROP POLICY IF EXISTS "Lectura autenticada balance" ON public.balance;
DROP POLICY IF EXISTS "Escritura solo admin balance" ON public.balance;

-- 2. ELIMINAR FUNCIÓN Y ROLES ESPECIALES
DROP FUNCTION IF EXISTS public.is_admin();

-- 3. RESTAURAR POLÍTICAS DE ACCESO TOTAL ORIGINALES A LAS TABLAS
CREATE POLICY "Permitir todo a anon en usuarios" ON public.usuarios FOR ALL USING (true);
CREATE POLICY "Permitir todo a anon en planilla_mensual" ON public.planilla_mensual FOR ALL USING (true);
CREATE POLICY "Permitir todo a anon en propuestas" ON public.propuestas FOR ALL USING (true);
CREATE POLICY "Permitir todo a anon en galeria" ON public.galeria FOR ALL USING (true);
CREATE POLICY "Permitir todo a anon en documentacion" ON public.documentacion FOR ALL USING (true);
CREATE POLICY "Permitir todo a anon en balance" ON public.balance FOR ALL USING (true);

-- 4. ELIMINAR LAS POLÍTICAS SEGURAS RECIENTES DE STORAGE (BUCKETS)
DROP POLICY IF EXISTS "Escritura admin galeria bucket" ON storage.objects;
DROP POLICY IF EXISTS "Borrado admin galeria bucket" ON storage.objects;
DROP POLICY IF EXISTS "Escritura admin documentacion bucket" ON storage.objects;
DROP POLICY IF EXISTS "Borrado admin documentacion bucket" ON storage.objects;

-- 5. RESTAURAR POLÍTICAS DE ACCESO PÚBLICO ORIGINALES EN STORAGE
CREATE POLICY "Acceso público de escritura a galeria" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'galeria');
CREATE POLICY "Acceso público de borrado a galeria" ON storage.objects FOR DELETE USING (bucket_id = 'galeria');
CREATE POLICY "Acceso público de escritura a documentacion" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documentacion');
CREATE POLICY "Acceso público de borrado a documentacion" ON storage.objects FOR DELETE USING (bucket_id = 'documentacion');

-- (Nota: Para los usuarios, ya no se utilizará auth.users. Todo vuelve a ser leído directamente de public.usuarios)
