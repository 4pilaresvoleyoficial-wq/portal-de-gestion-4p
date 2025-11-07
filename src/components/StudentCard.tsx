import { Student } from "@/pages/Students";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Phone, MoreVertical, Trash2, Edit, DollarSign, Calendar } from "lucide-react";
import { useState } from "react";
import { PaymentModal } from "./PaymentModal";
import { useToast } from "@/hooks/use-toast";

interface StudentCardProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onRefresh: () => void;
}

// 🧩 URL base de tu API (ajústala según tu despliegue)
const API_BASE = import.meta.env.VITE_SUPABASE_URL;

export const StudentCard = ({ student, onEdit, onDelete, onRefresh }: StudentCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      'no_pago': { variant: 'destructive', label: 'No Pagó' },
      'pendiente': { variant: 'secondary', label: 'Pendiente' },
      'promesa_pago': { variant: 'outline', label: 'Promesa' },
      'al_dia': { variant: 'default', label: 'Al Día' },
    };

    const config = variants[status] || variants['al_dia'];
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getWorstPaymentStatus = () => {
    if (!student.payments || student.payments.length === 0) return 'al_dia';

    const priority: Record<string, number> = {
      'no_pago': 1,
      'pendiente': 2,
      'promesa_pago': 3,
      'al_dia': 4,
    };

    return student.payments.reduce((worst, payment) => {
      return priority[payment.status] < priority[worst] ? payment.status : worst;
    }, 'al_dia');
  };

  const getPendingPayments = () => {
    if (!student.payments) return [];
    return student.payments.filter(
      (p) => p.status === 'no_pago' || p.status === 'pendiente' || p.status === 'promesa_pago'
    );
  };

  const getPhoneLabelText = (label: string) => {
    const labels: Record<string, string> = {
      propio: 'Propio',
      padre: 'Padre',
      madre: 'Madre',
      tutor: 'Tutor',
      otro: 'Otro',
    };
    return labels[label] || label;
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_BASE}/students/${student.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Error al eliminar el alumno");

      toast({
        title: "Alumno eliminado",
        description: `${student.first_name} ${student.last_name} fue eliminado correctamente.`,
      });

      onDelete(student.id);
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const monthNames = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">
                {student.first_name} {student.last_name}
              </h3>
              <p className="text-sm text-muted-foreground capitalize">{student.gender}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(student)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{student.phone_number}</span>
              <Badge variant="outline" className="text-xs">
                {getPhoneLabelText(student.phone_label)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Estado:</span>
            {getStatusBadge(getWorstPaymentStatus())}
          </div>

          {getPendingPayments().length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Meses adeudados ({getPendingPayments().length}/3):
              </p>
              {getPendingPayments().map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {monthNames[payment.month - 1]} {payment.year}
                    </span>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => setShowPaymentModal(true)}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Gestionar Pagos
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará al alumno{" "}
              <strong>
                {student.first_name} {student.last_name}
              </strong>{" "}
              y todos sus registros de pago.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDelete();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        student={student}
        onRefresh={onRefresh}
      />
    </>
  );
};
