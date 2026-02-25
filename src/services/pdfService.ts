import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ChecklistData } from "../types";
import { format } from "date-fns";

export const generatePDF = async (data: ChecklistData) => {
  const doc = new jsPDF();
  const timestamp = format(new Date(data.date), "dd/MM/yyyy HH:mm");

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text("EduCheck - Comprovante de Materiais", 105, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.text(`Escola Municipal de Tecnologia`, 105, 30, { align: "center" });
  
  doc.line(20, 35, 190, 35);

  // Info
  doc.setFontSize(10);
  doc.text(`Professor(a): ${data.teacherName}`, 20, 45);
  doc.text(`Data/Hora: ${timestamp}`, 20, 52);
  
  if (data.usageStartTime && data.usageEndTime) {
    doc.text(`Período de Uso: ${data.usageStartTime} às ${data.usageEndTime}`, 20, 59);
    doc.text(`Status: ${data.status === 'completed' ? 'CONCLUÍDO' : 'PENDENTE'}`, 20, 66);
  } else {
    doc.text(`Status: ${data.status === 'completed' ? 'CONCLUÍDO' : 'PENDENTE'}`, 20, 59);
  }

  // Table
  const tableData = data.items.map(item => [
    item.category,
    item.name,
    item.expectedQuantity.toString(),
    item.currentQuantity.toString(),
    item.expectedQuantity === item.currentQuantity ? "OK" : "DIVERGENTE"
  ]);

  autoTable(doc, {
    startY: data.usageStartTime ? 75 : 70,
    head: [['Categoria', 'Item', 'Esperado', 'Encontrado', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // Justification if needed
  if (data.justification) {
    doc.setFontSize(10);
    doc.text("Justificativa/Ocorrências:", 20, finalY + 10);
    doc.setFont("helvetica", "italic");
    doc.text(data.justification, 20, finalY + 17, { maxWidth: 170 });
  }

  // Signature
  if (data.signature) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Assinatura Digital:", 20, finalY + 40);
    doc.addImage(data.signature, 'PNG', 20, finalY + 45, 50, 20);
    doc.line(20, finalY + 65, 70, finalY + 65);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Documento gerado eletronicamente em ${timestamp}`, 105, 285, { align: "center" });

  return doc;
};

export const savePDFToServer = async (doc: jsPDF, teacherName: string) => {
  const fileName = `checklist_${teacherName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`;
  const pdfBase64 = doc.output('datauristring').split(',')[1];

  try {
    const response = await fetch('/api/save-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, pdfBase64 })
    });
    return await response.json();
  } catch (error) {
    console.error("Error saving to server:", error);
    throw error;
  }
};
