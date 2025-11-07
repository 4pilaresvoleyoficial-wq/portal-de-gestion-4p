import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Student, Payment } from "@/pages/Students";
import { Plus, Calendar, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  onRefresh: () => void;
}

export const PaymentModal = ({ open, onOpenChange, student, onRefresh }: PaymentModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPayment, setNewPayment] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    amount: 12000,
  });

  const API_URL = import.meta.env.VITE_SUPABASE_URL;

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      no_pago: "No Pagó",
      pendiente: "Pendiente",
      promesa_pago: "Promesa de Pago",
      al_dia: "Al Día",
    };
    return labels[status] || status;
  };

  // --- Crear pago ---
  const handleAddPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id,
          year: newPayment.year,
          month: newPayment.month,
          amount: newPayment.amount,
          status: "pendiente",
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al crear el pago");

      toast({
        title: "Pago agregado",
        description: "El mes adeudado se agregó correctamente",
      });
      setShowAddForm(false);
      onRefresh();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Actualizar estado ---
  const handleUpdatePaymentStatus = async (paymentId: string, newStatus: string) => {
    setLoading(true);
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "al_dia") updateData.paid_at = new Date().toISOString();

      const res = await fetch(`${API_URL}/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar el estado");

      toast({
        title: "Estado actualizado",
        description: `El pago se marcó como "${getStatusLabel(newStatus)}"`,
      });
      onRefresh();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Actualizar motivo ---
  const handleUpdatePaymentReason = async (paymentId: string, reason: string) => {
    try {
      const res = await fetch(`${API_URL}/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar el motivo");

      toast({
        title: "Motivo actualizado",
        description: "El motivo se guardó correctamente",
      });
      onRefresh();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // --- Eliminar pago ---
  const handleDeletePayment = async (paymentId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/payments/${paymentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar el pago");

      toast({
        title: "Pago eliminado",
        description: "El registro de pago se eliminó correctamente",
      });
      onRefresh();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Orden y lógica visual ---
  const sortedPayments = [...(student.payments || [])].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const pendingPayments = sortedPayments.filter(
    (p) => ["no_pago", "pendiente", "promesa_pago"].includes(p.status)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Gestionar Pagos - {student.first_name} {student.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Meses adeudados: {pendingPayments.length}/3
            </p>
            {pendingPayments.length < 3 && !showAddForm && (
              <Button size="sm" onClick={() => setShowAddForm(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Mes Adeudado
              </Button>
            )}
          </div>

          {showAddForm && (
            <Card className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mes</Label>
                  <Select
                    value={newPayment.month.toString()}
                    onValueChange={(value) =>
                      setNewPayment({ ...newPayment, month: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.map((name, index) => (
                        <SelectItem key={index} value={(index + 1).toString()}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Año</Label>
                  <Input
                    type="number"
                    value={newPayment.year}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, year: parseInt(e.target.value) })
                    }
                    min={2020}
                    max={2030}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Monto (ARS)</Label>
                <Input
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) =>
                    setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) })
                  }
                  min={0}
                  step={100}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddPayment} disabled={loading} className="flex-1">
                  Agregar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          )}

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {sortedPayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay registros de pago
                </p>
              ) : (
                sortedPayments.map((payment) => (
                  <Card key={payment.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {monthNames[payment.month - 1]} {payment.year}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          ${payment.amount.toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeletePayment(payment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select
                        value={payment.status}
                        onValueChange={(value) =>
                          handleUpdatePaymentStatus(payment.id, value)
                        }
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="no_pago">No Pagó</SelectItem>
                          <SelectItem value="promesa_pago">Promesa de Pago</SelectItem>
                          <SelectItem value="al_dia">Al Día</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {payment.status !== "al_dia" && (
                      <div className="space-y-2">
                        <Label>Motivo</Label>
                        <Textarea
                          value={payment.reason || ""}
                          onBlur={(e) =>
                            handleUpdatePaymentReason(payment.id, e.target.value)
                          }
                          placeholder="¿Por qué no pagó?"
                          className="min-h-[60px]"
                        />
                      </div>
                    )}

                    {payment.paid_at && (
                      <p className="text-xs text-muted-foreground">
                        Pagado el:{" "}
                        {new Date(payment.paid_at).toLocaleDateString("es-AR")}
                      </p>
                    )}
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
