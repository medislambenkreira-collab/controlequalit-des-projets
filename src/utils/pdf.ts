import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InspectionReport, InspectionRequest, Project, Phase, Discipline, QualityPlanItem, User, ChecklistResult } from '../types';
import { fmtDate, RESULT_LABELS } from './format';

interface Context {
  phase?: Phase;
  disc?: Discipline;
  qpItem?: QualityPlanItem;
  inspector?: User;
  requester?: User;
  qcManager?: User;
  checklist?: ChecklistResult[];
}

export function generatePV(report: InspectionReport, di: InspectionRequest, project: Project, ctx: Context) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PROCES VERBAL DE CONTROLE', 14, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`PV N° ${report.number}`, pageWidth - 14, 10, { align: 'right' });
  doc.text(`Date: ${fmtDate(report.date)}`, pageWidth - 14, 17, { align: 'right' });
  doc.text(`Révision: 00`, pageWidth - 14, 24, { align: 'right' });

  doc.setTextColor(0,0,0);
  doc.setFontSize(10);

  // Company / project info
  let y = 36;
  doc.setFont('helvetica', 'bold');
  doc.text('PROJET', 14, y); y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nom: ${project.name}`, 14, y); y += 4;
  doc.text(`N° Affaire: ${project.code}`, 14, y); y += 4;
  doc.text(`Client: ${project.client}`, 14, y); y += 4;
  doc.text(`EPC: ${project.epc}`, 14, y); y += 4;
  doc.text(`Site: ${project.site} / ${project.region}`, 14, y); y += 8;

  // Inspection info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('INFORMATIONS INSPECTION', 14, y); y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const infoLeft = [
    `Demande d'inspection: ${di.number}`,
    `Activité: ${ctx.qpItem?.activity || '-'}`,
    `Phase: ${ctx.phase?.name || '-'}`,
    `Corps d'état: ${ctx.disc?.name || '-'}`,
    `Zone: ${di.location}`,
  ];
  const infoRight = [
    `Date inspection: ${fmtDate(di.scheduledDate) || fmtDate(report.date)}`,
    `Inspecteur: ${ctx.inspector?.fullName || '-'}`,
    `Resp. Construction: ${ctx.requester?.fullName || '-'}`,
    `Resp. QC: ${ctx.qcManager?.fullName || '-'}`,
    `Niveau: ${di.controlLevel}`,
  ];
  infoLeft.forEach((t, i) => { doc.text(t, 14, y + i*4); });
  infoRight.forEach((t, i) => { doc.text(t, 110, y + i*4); });
  y += infoLeft.length * 4 + 6;

  // References
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('REFERENCES', 14, y); y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`PCQ ligne ${ctx.qpItem?.number || '-'}  |  ITP: ${di.itpReference || ctx.qpItem?.itpReference || '-'}  |  Procédure: ${ctx.qpItem?.procedure || '-'}  |  Critère: ${ctx.qpItem?.acceptanceCriteria || '-'}`, 14, y, { maxWidth: pageWidth - 28 });
  y += 10;

  // Result table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RESULTATS DU CONTROLE', 14, y); y += 5;
  const tableData = (ctx.checklist || []).map(c => [c.point, c.requirement, c.result==='C'?'Conforme':c.result==='NC'?'Non conforme':'N/A', c.comment || '']);
  autoTable(doc, {
    startY: y, head: [['Point contrôlé', 'Exigence', 'Résultat', 'Commentaire']], body: tableData,
    theme: 'striped', headStyles: { fillColor: [30,64,175], fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Conclusion
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CONCLUSION', 14, y); y += 5;
  const resultColor = report.result === 'conform' ? [16,185,129] : report.result === 'non_conform' ? [239,68,68] : report.result === 'conform_with_obs' ? [245,158,11] : [148,163,184];
  doc.setFillColor(resultColor[0], resultColor[1], resultColor[2]);
  doc.rect(14, y-3, pageWidth - 28, 8, 'F');
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica', 'bold');
  doc.text(RESULT_LABELS[report.result].toUpperCase(), pageWidth/2, y+2.5, { align: 'center' });
  doc.setTextColor(0,0,0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 10;
  const lines = doc.splitTextToSize(report.conclusion, pageWidth - 28);
  doc.text(lines, 14, y);
  y += lines.length * 4 + 8;

  if (di.observations) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('OBSERVATIONS', 14, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const obs = doc.splitTextToSize(di.observations, pageWidth - 28);
    doc.text(obs, 14, y); y += obs.length * 4 + 6;
  }

  // Signatures
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('SIGNATURES', 14, y); y += 8;
  const signers = [
    { label: 'Responsable Construction', name: ctx.requester?.fullName || '' },
    { label: 'Inspecteur QC', name: ctx.inspector?.fullName || '' },
    { label: 'Responsable QC', name: ctx.qcManager?.fullName || '' },
    { label: 'Client / Représentant', name: '' },
  ];
  const colW = (pageWidth - 28) / 2;
  signers.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i/2);
    const x = 14 + col * colW;
    const yy = y + row * 28;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(s.label, x, yy);
    doc.setDrawColor(100); doc.line(x, yy+14, x+colW-10, yy+14);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(s.name || ' ', x, yy+12);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
    doc.text('Nom / Date / Signature', x, yy+19);
    doc.setTextColor(0,0,0);
  });

  doc.save(`PV_${report.number}.pdf`);
}
