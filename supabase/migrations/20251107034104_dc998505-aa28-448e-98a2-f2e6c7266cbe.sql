-- Crear tabla de alumnos
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('mujer', 'hombre', 'otro')),
  category TEXT NOT NULL CHECK (category IN ('mujeres', 'hombres')),
  phone_number TEXT NOT NULL,
  phone_label TEXT NOT NULL CHECK (phone_label IN ('propio', 'padre', 'madre', 'tutor', 'otro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla de pagos
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  amount DECIMAL(10, 2) NOT NULL DEFAULT 12000.00,
  status TEXT NOT NULL CHECK (status IN ('no_pago', 'pendiente', 'promesa_pago', 'al_dia')) DEFAULT 'pendiente',
  reason TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, year, month)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_students_category ON public.students(category);
CREATE INDEX idx_students_gender ON public.students(gender);
CREATE INDEX idx_payments_student_id ON public.payments(student_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_year_month ON public.payments(year, month);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para validar máximo 3 meses adeudados por alumno
CREATE OR REPLACE FUNCTION public.check_max_pending_payments()
RETURNS TRIGGER AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  -- Solo validar si el nuevo pago está pendiente/no_pago/promesa_pago
  IF NEW.status IN ('no_pago', 'pendiente', 'promesa_pago') THEN
    SELECT COUNT(*) INTO pending_count
    FROM public.payments
    WHERE student_id = NEW.student_id
      AND status IN ('no_pago', 'pendiente', 'promesa_pago')
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    IF pending_count >= 3 THEN
      RAISE EXCEPTION 'El alumno ya tiene 3 meses adeudados. No se pueden agregar más.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_pending_payments_before_insert
  BEFORE INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_pending_payments();

CREATE TRIGGER check_pending_payments_before_update
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_pending_payments();

-- Función para crear pago del mes actual al registrar alumno
CREATE OR REPLACE FUNCTION public.create_current_month_payment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.payments (student_id, year, month, amount, status)
  VALUES (
    NEW.id,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    12000.00,
    'pendiente'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_payment_after_student_insert
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.create_current_month_payment();

-- Habilitar Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Crear tabla de roles de usuario para admin
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función security definer para verificar rol de admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_admin.user_id
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS: Solo admins pueden ver y modificar estudiantes
CREATE POLICY "Admin can view all students"
  ON public.students FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin can insert students"
  ON public.students FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin can update students"
  ON public.students FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin can delete students"
  ON public.students FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Políticas RLS: Solo admins pueden ver y modificar pagos
CREATE POLICY "Admin can view all payments"
  ON public.payments FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin can update payments"
  ON public.payments FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin can delete payments"
  ON public.payments FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Política RLS: Usuarios pueden ver sus propios roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);