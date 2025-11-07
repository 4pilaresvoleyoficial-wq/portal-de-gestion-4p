import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Plus, Search, AlertCircle, CheckCircle, Clock, DollarSign } from "lucide-react";
import { StudentModal } from "@/components/StudentModal";
import { StudentCard } from "@/components/StudentCard";
import { useToast } from "@/hooks/use-toast";

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  category: string;
  phone_number: string;
  phone_label: string;
  created_at: string;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  student_id: string;
  year: number;
  month: number;
  amount: number;
  status: 'no_pago' | 'pendiente' | 'promesa_pago' | 'al_dia';
  reason?: string;
  notes?: string;
  paid_at?: string;
  created_at: string;
}

// ✅ Define la URL base de tu API
const API_URL = import.meta.env.VITE_SUPABASE_URL;

export default function Students() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"mujeres" | "hombres">("mujeres");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // 🔄 ya no verificamos session con supabase
  useEffect(() => {
    loadStudents();
  }, []);

  // --- Carga estudiantes desde tu API ---
  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/students`);
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      setStudents(data);
    } catch (error: any) {
      console.error("Error loading students:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los alumnos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Crear o actualizar estudiante desde modal ---
  const handleStudentSaved = async () => {
    await loadStudents();
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  // --- Editar estudiante ---
  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  // --- Eliminar estudiante ---
  const handleDeleteStudent = async (studentId: string) => {
    try {
      const response = await fetch(`${API_URL}/students/${studentId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error eliminando estudiante");

      toast({
        title: "Alumno eliminado",
        description: "El alumno ha sido eliminado correctamente",
      });

      loadStudents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getWorstPaymentStatus = (payments?: Payment[]) => {
    if (!payments || payments.length === 0) return 'al_dia';
    const priority = {
      no_pago: 1,
      pendiente: 2,
      promesa_pago: 3,
      al_dia: 4
    };
    const worst = payments.reduce((acc, p) =>
      priority[p.status] < priority[acc] ? p.status : acc, 'al_dia'
    );
    return worst;
  };

  const filteredStudents = students
    .filter(s => s.category === selectedCategory)
    .filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const order = { no_pago: 1, pendiente: 2, promesa_pago: 3, al_dia: 4 };
      return order[getWorstPaymentStatus(a.payments)] - order[getWorstPaymentStatus(b.payments)];
    });

  const getStatusCount = (status: string) => {
    return students.filter(s =>
      s.category === selectedCategory &&
      getWorstPaymentStatus(s.payments) === status
    ).length;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Alumnos</h2>
            <p className="text-muted-foreground">Gestiona las cuotas mensuales del club</p>
          </div>
          <Button
            onClick={() => {
              setSelectedStudent(null);
              setIsModalOpen(true);
            }}
            size="lg"
            className="w-full sm:w-auto h-12"
          >
            <Plus className="mr-2 h-5 w-5" />
            Registrar Alumno
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4"><div className="flex items-center gap-3"><div className="rounded-full bg-destructive/10 p-2"><AlertCircle className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{getStatusCount('no_pago')}</p><p className="text-xs text-muted-foreground">No Pagaron</p></div></div></Card>
          <Card className="p-4"><div className="flex items-center gap-3"><div className="rounded-full bg-warning/10 p-2"><Clock className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">{getStatusCount('pendiente')}</p><p className="text-xs text-muted-foreground">Pendientes</p></div></div></Card>
          <Card className="p-4"><div className="flex items-center gap-3"><div className="rounded-full bg-accent/10 p-2"><DollarSign className="h-5 w-5 text-accent" /></div><div><p className="text-2xl font-bold">{getStatusCount('promesa_pago')}</p><p className="text-xs text-muted-foreground">Promesas</p></div></div></Card>
          <Card className="p-4"><div className="flex items-center gap-3"><div className="rounded-full bg-success/10 p-2"><CheckCircle className="h-5 w-5 text-success" /></div><div><p className="text-2xl font-bold">{getStatusCount('al_dia')}</p><p className="text-xs text-muted-foreground">Al Día</p></div></div></Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Tabs */}
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="mujeres" className="text-base">
              Mujeres ({students.filter(s => s.category === 'mujeres').length})
            </TabsTrigger>
            <TabsTrigger value="hombres" className="text-base">
              Hombres ({students.filter(s => s.category === 'hombres').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {loading ? (
              <div className="text-center py-12"><p className="text-muted-foreground">Cargando alumnos...</p></div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery ? "No se encontraron alumnos con ese nombre" : "No hay alumnos registrados"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onEdit={handleEditStudent}
                    onDelete={handleDeleteStudent}
                    onRefresh={loadStudents}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <StudentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        student={selectedStudent}
        onSaved={handleStudentSaved}
      />
    </Layout>
  );
}
