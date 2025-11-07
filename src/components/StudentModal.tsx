import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/pages/Students";
import { z } from "zod";

// ✅ URL base de tu API
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL;

const studentSchema = z.object({
  first_name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  last_name: z.string().trim().min(1, "El apellido es obligatorio").max(100),
  gender: z.enum(["mujer", "hombre", "otro"], { required_error: "El género es obligatorio" }),
  category: z.enum(["mujeres", "hombres"], { required_error: "La categoría es obligatoria" }),
  phone_number: z.string().trim().min(1, "El teléfono es obligatorio").max(20),
  phone_label: z.enum(["propio", "padre", "madre", "tutor", "otro"], { required_error: "La etiqueta es obligatoria" }),
});

interface StudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onSaved: () => void;
}

export const StudentModal = ({ open, onOpenChange, student, onSaved }: StudentModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    gender: "" as "mujer" | "hombre" | "otro",
    category: "" as "mujeres" | "hombres",
    phone_number: "",
    phone_label: "" as "propio" | "padre" | "madre" | "tutor" | "otro",
  });

  useEffect(() => {
    if (student) {
      setFormData({
        first_name: student.first_name,
        last_name: student.last_name,
        gender: student.gender as "mujer" | "hombre" | "otro",
        category: student.category as "mujeres" | "hombres",
        phone_number: student.phone_number,
        phone_label: student.phone_label as "propio" | "padre" | "madre" | "tutor" | "otro",
      });
    } else {
      setFormData({
        first_name: "",
        last_name: "",
        gender: "" as "mujer" | "hombre" | "otro",
        category: "" as "mujeres" | "hombres",
        phone_number: "",
        phone_label: "" as "propio" | "padre" | "madre" | "tutor" | "otro",
      });
    }
  }, [student, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = studentSchema.parse(formData);

      const method = student ? "PATCH" : "POST";
      const endpoint = student ? `${API_BASE_URL}/${student.id}` : API_BASE_URL;

      console.log("Validated data:", validated);

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validated),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar el alumno");
      }

      toast({
        title: student ? "Alumno actualizado" : "Alumno registrado",
        description: student
          ? "Los datos del alumno se actualizaron correctamente"
          : "El alumno se registró correctamente con el pago del mes actual",
      });

      onSaved();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {student ? "Editar Alumno" : "Registrar Nuevo Alumno"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                placeholder="Juan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                placeholder="Pérez"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Género *</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value as any })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mujer">Mujer</SelectItem>
                <SelectItem value="hombre">Hombre</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as any })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mujeres">Mujeres</SelectItem>
                <SelectItem value="hombres">Hombres</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Teléfono *</Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              required
              placeholder="1234567890"
              inputMode="tel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_label">Teléfono pertenece a *</Label>
            <Select
              value={formData.phone_label}
              onValueChange={(value) => setFormData({ ...formData, phone_label: value as any })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar titular" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="propio">Propio</SelectItem>
                <SelectItem value="padre">Padre</SelectItem>
                <SelectItem value="madre">Madre</SelectItem>
                <SelectItem value="tutor">Tutor</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : student ? "Actualizar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
