import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export interface AnalyticsMetricSummary {
  courseCompletionRate: number;
  attendanceRate: number;
  abnormalAttendanceRate: number;
  dimensionCount: number;
}

export interface AnalyticsGradeRow {
  grade: string;
  studentCount: number;
  courseCompletionRate: number;
  attendanceRate: number;
  abnormalAttendanceRate: number;
  averageScore: number;
}

export interface AnalyticsTrendRow {
  label: string;
  courseCompletionRate: number;
  attendanceRate: number;
  averageScore: number;
}

export interface AnalyticsExportOptions {
  periodLabel: string;
  dimensionLabel: string;
  summary: AnalyticsMetricSummary;
  grades: AnalyticsGradeRow[];
  trends: AnalyticsTrendRow[];
}

const escapeHtml = (value: unknown) => String(value ?? '-')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const buildOverviewRows = (options: AnalyticsExportOptions) => [
  { Field: '统计周期', Value: options.periodLabel },
  { Field: '统计维度', Value: options.dimensionLabel },
  { Field: '课程完成率', Value: `${options.summary.courseCompletionRate}%` },
  { Field: '考勤合格率', Value: `${options.summary.attendanceRate}%` },
  { Field: '异常考勤率', Value: `${options.summary.abnormalAttendanceRate}%` },
  { Field: '报表维度数', Value: options.summary.dimensionCount },
  { Field: '生成时间', Value: dayjs().format('YYYY-MM-DD HH:mm:ss') },
];

const buildGradeRows = (rows: AnalyticsGradeRow[]) => rows.map((item) => ({
  '年级/维度': item.grade,
  '学生数': item.studentCount,
  '课程完成率': `${item.courseCompletionRate}%`,
  '考勤合格率': `${item.attendanceRate}%`,
  '异常考勤率': `${item.abnormalAttendanceRate}%`,
  '平均成绩': item.averageScore,
}));

const buildTrendRows = (rows: AnalyticsTrendRow[]) => rows.map((item) => ({
  '时间周期': item.label,
  '课程完成率': `${item.courseCompletionRate}%`,
  '考勤合格率': `${item.attendanceRate}%`,
  '平均成绩': item.averageScore,
}));

const rowsToHtmlTable = (title: string, rows: Array<Record<string, unknown>>) => {
  if (!rows.length) {
    return `<section><h2>${escapeHtml(title)}</h2><p>暂无数据</p></section>`;
  }

  const headers = Object.keys(rows[0]);
  const headHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const bodyHtml = rows
    .map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`)
    .join('');

  return `
    <section>
      <h2>${escapeHtml(title)}</h2>
      <table>
        <thead><tr>${headHtml}</tr></thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </section>
  `;
};

const applySheetStyles = (sheet: XLSX.WorkSheet, widths: number[]) => {
  sheet['!cols'] = widths.map((width) => ({ wch: width }));
};

export const exportAnalyticsExcel = (options: AnalyticsExportOptions): string => {
  const workbook = XLSX.utils.book_new();
  const overviewSheet = XLSX.utils.json_to_sheet(buildOverviewRows(options));
  applySheetStyles(overviewSheet, [16, 30]);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, '数据概览');

  const gradeSheet = XLSX.utils.json_to_sheet(buildGradeRows(options.grades));
  applySheetStyles(gradeSheet, [14, 10, 14, 14, 14, 12]);
  XLSX.utils.book_append_sheet(workbook, gradeSheet, '年级统计');

  const trendSheet = XLSX.utils.json_to_sheet(buildTrendRows(options.trends));
  applySheetStyles(trendSheet, [12, 14, 14, 12]);
  XLSX.utils.book_append_sheet(workbook, trendSheet, '趋势分析');

  const filename = `数据统计报表_${options.periodLabel}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, filename);
  return filename;
};

const buildAnalyticsPdfHtml = (filename: string, options: AnalyticsExportOptions) => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(filename)}</title>
  <style>
    body { font-family: Arial, "Microsoft YaHei", sans-serif; color: #1f2937; margin: 0; padding: 24px; background: #ffffff; }
    .page { width: 1040px; margin: 0 auto; }
    h1 { font-size: 24px; margin: 0 0 8px; }
    h2 { font-size: 18px; margin: 24px 0 12px; }
    p { margin: 0 0 8px; color: #4b5563; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; table-layout: fixed; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; font-size: 12px; vertical-align: top; word-break: break-word; }
    th { background: #f3f4f6; text-align: left; }
  </style>
</head>
<body>
  <div class="page">
    <h1>数据统计报表</h1>
    <p>统计周期：${escapeHtml(options.periodLabel)}</p>
    <p>统计维度：${escapeHtml(options.dimensionLabel)}</p>
    ${rowsToHtmlTable('数据概览', buildOverviewRows(options))}
    ${rowsToHtmlTable('年级统计', buildGradeRows(options.grades))}
    ${rowsToHtmlTable('趋势分析', buildTrendRows(options.trends))}
  </div>
</body>
</html>`;

export const exportAnalyticsPdf = async (options: AnalyticsExportOptions): Promise<string> => {
  const filename = `数据统计报表_${options.periodLabel}_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`;
  const html = buildAnalyticsPdfHtml(filename, options);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '1100px';
  container.style.background = '#ffffff';
  container.style.zIndex = '-1';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    if ('fonts' in document) {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    }

    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imageData = canvas.toDataURL('image/png');

    let remainingHeight = imgHeight;
    let position = 0;

    pdf.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    remainingHeight -= pageHeight;

    while (remainingHeight > 0) {
      position = remainingHeight - imgHeight;
      pdf.addPage();
      pdf.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      remainingHeight -= pageHeight;
    }

    pdf.save(filename);
    return filename;
  } finally {
    container.remove();
  }
};
