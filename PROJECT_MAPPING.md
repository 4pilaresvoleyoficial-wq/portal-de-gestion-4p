# Mapeo General del Proyecto - Portal de Gestión 4 Pilares

## 📋 Información General

**Nombre del Proyecto:** Portal de Gestión 4 Pilares  
**Tipo:** Aplicación Web de Gestión de Cuotas Deportivas  
**Tecnología Principal:** React + TypeScript + Vite  
**Framework UI:** shadcn/ui + Tailwind CSS  
**Backend:** Supabase (PostgreSQL + Auth + Real-time)  
**Gestión de Estado:** React Query (TanStack Query)  
**Validación:** Zod  
**Fecha de Análisis:** $(date +%Y-%m-%d)

## 🏗️ Arquitectura del Proyecto

### Estructura de Directorios
```
portal-de-gestion-4p/
├── src/                          # Código fuente principal
│   ├── components/              # Componentes React
│   │   ├── ui/                   # Componentes UI (shadcn/ui)
│   │   ├── Layout.tsx           # Layout principal con navegación
│   │   ├── StudentCard.tsx      # Tarjeta de estudiante
│   │   ├── StudentModal.tsx     # Modal para crear/editar estudiantes
│   │   ├── PaymentModal.tsx     # Modal para gestionar pagos
│   │   └── NavLink.tsx          # Componente de enlace de navegación
│   ├── pages/                   # Páginas principales
│   │   ├── Students.tsx         # Página principal de gestión
│   │   ├── Auth.tsx             # Página de autenticación
│   │   └── NotFound.tsx         # Página 404
│   ├── integrations/            # Integraciones externas
│   │   └── supabase/            # Cliente y tipos de Supabase
│   ├── hooks/                   # Hooks personalizados
│   ├── lib/                     # Utilidades y helpers
│   └── main.tsx                 # Punto de entrada
├── supabase/                    # Configuración y migraciones
│   ├── migrations/              # Esquemas de base de datos
│   └── functions/               # Funciones edge de Supabase
├── public/                      # Assets estáticos
└── configuraciones de build     # Vite, TypeScript, ESLint, etc.
```

## 🔧 Tecnologías y Dependencias

### Core Dependencies
- **React 18.3.1** - Framework principal
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **React Router DOM** - Navegación client-side
- **TanStack Query** - Gestión de estado del servidor

### UI y Estilos
- **shadcn/ui** - Componentes UI modernos
- **Tailwind CSS** - Framework de utilidades CSS
- **Lucide React** - Iconos
- **Radix UI** - Componentes accesibles de bajo nivel

### Backend y Base de Datos
- **Supabase** - Backend como servicio
- **PostgreSQL** - Base de datos relacional
- **Row Level Security (RLS)** - Seguridad a nivel de filas

### Validación y Utilidades
- **Zod** - Validación de esquemas
- **date-fns** - Manipulación de fechas
- **clsx & tailwind-merge** - Utilidades de clases CSS

## 📊 Esquema de Base de Datos

### Tabla `students` (Alumnos)
```sql
- id (UUID, PK): Identificador único
- first_name (TEXT): Nombre
- last_name (TEXT): Apellido  
- gender (TEXT): Género ('mujer', 'hombre', 'otro')
- category (TEXT): Categoría ('mujeres', 'hombres')
- phone_number (TEXT): Número de teléfono
- phone_label (TEXT): Etiqueta del teléfono
- created_at (TIMESTAMPTZ): Fecha de creación
- updated_at (TIMESTAMPTZ): Última actualización
```

### Tabla `payments` (Pagos)
```sql
- id (UUID, PK): Identificador único
- student_id (UUID, FK): Referencia al alumno
- year (INTEGER): Año del pago
- month (INTEGER): Mes del pago (1-12)
- amount (DECIMAL): Monto del pago (default: 12000.00)
- status (TEXT): Estado del pago
  - 'no_pago': No pagó
  - 'pendiente': Pendiente
  - 'promesa_pago': Promesa de pago
  - 'al_dia': Al día
- reason (TEXT): Razón del estado
- notes (TEXT): Notas adicionales
- paid_at (TIMESTAMPTZ): Fecha de pago real
- created_at (TIMESTAMPTZ): Fecha de creación
- updated_at (TIMESTAMPTZ): Última actualización
```

### Tabla `user_roles` (Roles de Usuario)
```sql
- id (UUID, PK): Identificador único
- user_id (UUID, FK): Referencia al usuario de auth
- role (ENUM): Rol del usuario ('admin', 'user')
- created_at (TIMESTAMPTZ): Fecha de creación
```

## 🔐 Seguridad y Autenticación

### Sistema de Autenticación
- **Supabase Auth** - Gestión de usuarios y sesiones
- **JWT Tokens** - Tokens de acceso seguros
- **Row Level Security** - Políticas de seguridad a nivel de filas

### Roles y Permisos
- **Admin**: Puede ver, crear, editar y eliminar todos los registros
- **User**: Puede ver información básica (según configuración)

### Políticas RLS Implementadas
- Solo administradores pueden ver/modificar estudiantes
- Solo administradores pueden ver/modificar pagos
- Usuarios pueden ver sus propios roles

## 🎨 Diseño y UX

### Sistema de Diseño
- **Color Scheme**: Esquema de colores profesional con variaciones
- **Tipografía**: Sistema tipográfico consistente
- **Espaciado**: Sistema de espaciado basado en Tailwind
- **Componentes**: Biblioteca completa de componentes reutilizables

### Páginas Principales
1. **Login/Registro**: Autenticación de usuarios
2. **Dashboard Principal**: Gestión de alumnos y pagos
3. **Gestión de Estudiantes**: CRUD completo
4. **Gestión de Pagos**: Control de cuotas mensuales

## 📱 Funcionalidades Clave

### Gestión de Alumnos
- ✅ CRUD completo de alumnos
- ✅ Filtrado por categoría (mujeres/hombres)
- ✅ Búsqueda por nombre
- ✅ Validación de datos con Zod

### Gestión de Pagos
- ✅ Control mensual de cuotas
- ✅ Estados de pago múltiples
- ✅ Límite de 3 meses adeudados
- ✅ Historial de pagos por alumno

### Dashboard y Estadísticas
- ✅ Vista general por categoría
- ✅ Estadísticas de pagos
- ✅ Estados visualizados con badges
- ✅ Ordenamiento por estado de pago

### Sistema de Autenticación
- ✅ Login seguro con Supabase
- ✅ Registro de nuevos usuarios
- ✅ Gestión de sesiones
- ✅ Redirección automática

## 🚀 Configuración y Despliegue

### Variables de Entorno
```env
VITE_SUPABASE_PROJECT_ID="taazvorullpcugrodltc"
VITE_SUPABASE_PUBLISHABLE_KEY="..."
VITE_SUPABASE_URL="https://taazvorullpcugrodltc.supabase.co"
```

### Scripts de Desarrollo
```bash
npm run dev        # Desarrollo local
npm run build      # Build de producción
npm run lint       # Linting
npm run preview    # Previsualización
```

### Puerto de Desarrollo
- **Local**: http://localhost:8080
- **Build**: Optimizado para producción

## 🔍 Análisis de Código

### Componentes Principales
- **Students.tsx**: 319 líneas - Página principal con lógica completa
- **StudentCard.tsx**: 193 líneas - Tarjeta de estudiante con acciones
- **StudentModal.tsx**: 235 líneas - Modal de creación/edición
- **Auth.tsx**: 223 líneas - Sistema de autenticación
- **Layout.tsx**: 57 líneas - Layout principal de la aplicación

### Hooks Personalizados
- **use-mobile.tsx**: Detección de dispositivos móviles
- **use-toast.ts**: Sistema de notificaciones

### Integraciones
- **Supabase Client**: Configuración y tipos TypeScript
- **Database Types**: Tipos generados automáticamente

## 📈 Características Avanzadas

### Validación y Seguridad
- ✅ Validación de formularios con Zod
- ✅ Prevención de inyección SQL (RLS)
- ✅ Manejo de errores robusto
- ✅ Feedback visual con toasts

### Rendimiento
- ✅ Optimización de consultas con índices
- ✅ Carga diferida de componentes
- ✅ Caché de React Query
- ✅ Build optimizado con Vite

### Accesibilidad
- ✅ Componentes accesibles (Radix UI)
- ✅ Navegación por teclado
- ✅ Etiquetas ARIA apropiadas
- ✅ Contraste de colores adecuado

## 🔧 Extensiones y Mejoras Sugeridas

### Funcionalidades Futuras
1. **Reportes y Exportación**: PDF, Excel, estadísticas detalladas
2. **Notificaciones Automáticas**: Recordatorios de pago por WhatsApp/Email
3. **Gestión de Múltiples Clubes**: Soporte para múltiples organizaciones
4. **App Móvil**: Versión móvil nativa o PWA
5. **Panel de Administración Avanzado**: Gestión de usuarios y permisos

### Mejoras Técnicas
1. **Testing**: Implementar tests unitarios y de integración
2. **CI/CD**: Pipeline de despliegue automático
3. **Monitoreo**: Herramientas de analytics y monitoreo de errores
4. **Optimización de Imágenes**: Compresión y lazy loading
5. **Internacionalización**: Soporte para múltiples idiomas

## 📚 Documentación Adicional

### Recursos
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de React Query](https://tanstack.com/query/latest)
- [Documentación de shadcn/ui](https://ui.shadcn.com/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)

### Comandos Útiles
```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build de producción
npm run build

# Linting
npm run lint
```

---

**Última actualización**: $(date +%Y-%m-%d %H:%M:%S)  
**Versión**: 1.0.0  
**Estado**: Activo en desarrollo