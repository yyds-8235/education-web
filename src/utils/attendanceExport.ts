import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import type { AttendanceRecord, AttendanceType } from '@/types';

export type AttendanceReportType = 'personal' | 'class' | 'grade';

export interface AttendanceExportFilters {
    startDate?: string;
    endDate?: string;
    studentName?: string;
    studentNo?: string;
    grade?: string;
    className?: string;
    type?: AttendanceType;
}

export interface AttendanceExportOptions extends AttendanceExportFilters {
    reportType: AttendanceReportType;
}

const reportTypeLabels: Record<AttendanceReportType, string> = {
    personal: '个人',
    class: '班级',
    grade: '年级',
};

const attendanceTypeLabels: Record<AttendanceType, string> = {
    present: '出勤',
    late: '迟到',
    early_leave: '早退',
    absent: '旷课',
    leave: '请假',
};

const emptyStats = {
    total: 0,
    present: 0,
    late: 0,
    earlyLeave: 0,
    absent: 0,
    leave: 0,
};

const normalize = (value?: string) => value?.trim().toLowerCase() ?? '';

const getExportScope = (options: AttendanceExportOptions) => (
    options.reportType === 'personal'
        ? options.studentNo?.trim() || options.studentName?.trim() || '个人'
        : options.reportType === 'class'
            ? `${options.grade ?? ''}${options.className ?? ''}` || '班级'
            : options.grade?.trim() || '年级'
);

const escapeHtml = (value: unknown) => String(value ?? '-')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const rowsToHtmlTable = (
    title: string,
    rows: Array<Record<string, unknown>>,
) => {
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
                <thead>
                    <tr>${headHtml}</tr>
                </thead>
                <tbody>
                    ${bodyHtml}
                </tbody>
            </table>
        </section>
    `;
};

export const filterAttendanceRecords = (
    records: AttendanceRecord[],
    filters: AttendanceExportFilters,
): AttendanceRecord[] => {
    const studentName = normalize(filters.studentName);
    const studentNo = normalize(filters.studentNo);
    const grade = filters.grade?.trim();
    const className = filters.className?.trim();

    return records.filter((record) => {
        if (studentName && !record.studentName.toLowerCase().includes(studentName)) {
            return false;
        }

        if (studentNo && !record.studentNo.toLowerCase().includes(studentNo)) {
            return false;
        }

        if (grade && record.grade !== grade) {
            return false;
        }

        if (className && record.class !== className) {
            return false;
        }

        if (filters.type && record.type !== filters.type) {
            return false;
        }

        if (filters.startDate && dayjs(record.date).isBefore(filters.startDate, 'day')) {
            return false;
        }

        if (filters.endDate && dayjs(record.date).isAfter(filters.endDate, 'day')) {
            return false;
        }

        return true;
    });
};

const buildOverviewStats = (records: AttendanceRecord[]) => {
    return records.reduce(
        (stats, record) => {
            stats.total += 1;
            if (record.type === 'present') stats.present += 1;
            if (record.type === 'late') stats.late += 1;
            if (record.type === 'early_leave') stats.earlyLeave += 1;
            if (record.type === 'absent') stats.absent += 1;
            if (record.type === 'leave') stats.leave += 1;
            return stats;
        },
        { ...emptyStats },
    );
};

const buildPersonalSummaryRows = (records: AttendanceRecord[]) => {
    const grouped = new Map<
        string,
        {
            studentName: string;
            studentNo: string;
            grade: string;
            className: string;
            total: number;
            present: number;
            late: number;
            earlyLeave: number;
            absent: number;
            leave: number;
        }
    >();

    records.forEach((record) => {
        const current = grouped.get(record.studentId) ?? {
            studentName: record.studentName,
            studentNo: record.studentNo,
            grade: record.grade,
            className: record.class,
            total: 0,
            present: 0,
            late: 0,
            earlyLeave: 0,
            absent: 0,
            leave: 0,
        };

        current.total += 1;
        if (record.type === 'present') current.present += 1;
        if (record.type === 'late') current.late += 1;
        if (record.type === 'early_leave') current.earlyLeave += 1;
        if (record.type === 'absent') current.absent += 1;
        if (record.type === 'leave') current.leave += 1;

        grouped.set(record.studentId, current);
    });

    return [...grouped.values()].map((item) => ({
        学号: item.studentNo,
        姓名: item.studentName,
        年级: item.grade,
        班级: item.className,
        记录数: item.total,
        出勤: item.present,
        迟到: item.late,
        早退: item.earlyLeave,
        旷课: item.absent,
        请假: item.leave,
    }));
};

const buildClassSummaryRows = (records: AttendanceRecord[]) => {
    const grouped = new Map<
        string,
        {
            studentName: string;
            studentNo: string;
            total: number;
            present: number;
            late: number;
            earlyLeave: number;
            absent: number;
            leave: number;
        }
    >();

    records.forEach((record) => {
        const current = grouped.get(record.studentId) ?? {
            studentName: record.studentName,
            studentNo: record.studentNo,
            total: 0,
            present: 0,
            late: 0,
            earlyLeave: 0,
            absent: 0,
            leave: 0,
        };

        current.total += 1;
        if (record.type === 'present') current.present += 1;
        if (record.type === 'late') current.late += 1;
        if (record.type === 'early_leave') current.earlyLeave += 1;
        if (record.type === 'absent') current.absent += 1;
        if (record.type === 'leave') current.leave += 1;

        grouped.set(record.studentId, current);
    });

    return [...grouped.values()].map((item) => ({
        学号: item.studentNo,
        姓名: item.studentName,
        记录数: item.total,
        出勤: item.present,
        迟到: item.late,
        早退: item.earlyLeave,
        旷课: item.absent,
        请假: item.leave,
    }));
};

const buildGradeSummaryRows = (records: AttendanceRecord[]) => {
    const grouped = new Map<
        string,
        {
            grade: string;
            className: string;
            total: number;
            present: number;
            late: number;
            earlyLeave: number;
            absent: number;
            leave: number;
        }
    >();

    records.forEach((record) => {
        const key = `${record.grade}-${record.class}`;
        const current = grouped.get(key) ?? {
            grade: record.grade,
            className: record.class,
            total: 0,
            present: 0,
            late: 0,
            earlyLeave: 0,
            absent: 0,
            leave: 0,
        };

        current.total += 1;
        if (record.type === 'present') current.present += 1;
        if (record.type === 'late') current.late += 1;
        if (record.type === 'early_leave') current.earlyLeave += 1;
        if (record.type === 'absent') current.absent += 1;
        if (record.type === 'leave') current.leave += 1;

        grouped.set(key, current);
    });

    return [...grouped.values()].map((item) => ({
        年级: item.grade,
        班级: item.className,
        记录数: item.total,
        出勤: item.present,
        迟到: item.late,
        早退: item.earlyLeave,
        旷课: item.absent,
        请假: item.leave,
    }));
};

const buildDetailRows = (records: AttendanceRecord[]) => records.map((record) => ({
    日期: record.date,
    学号: record.studentNo,
    姓名: record.studentName,
    年级: record.grade,
    班级: record.class,
    考勤状态: attendanceTypeLabels[record.type],
    签到时间: record.checkInTime ?? '-',
    签退时间: record.checkOutTime ?? '-',
    异常标记: record.isException ? '是' : '否',
    异常说明: record.exceptionNote ?? '-',
}));

const buildOverviewRows = (records: AttendanceRecord[], options: AttendanceExportOptions) => {
    const stats = buildOverviewStats(records);

    return [
        { 字段: '报表类型', 值: `${reportTypeLabels[options.reportType]}报表` },
        { 字段: '导出日期范围', 值: `${options.startDate ?? '-'} 至 ${options.endDate ?? '-'}` },
        { 字段: '姓名筛选', 值: options.studentName?.trim() || '-' },
        { 字段: '学号筛选', 值: options.studentNo?.trim() || '-' },
        { 字段: '年级筛选', 值: options.grade?.trim() || '-' },
        { 字段: '班级筛选', 值: options.className?.trim() || '-' },
        { 字段: '状态筛选', 值: options.type ? attendanceTypeLabels[options.type] : '全部' },
        { 字段: '记录总数', 值: stats.total },
        { 字段: '出勤', 值: stats.present },
        { 字段: '迟到', 值: stats.late },
        { 字段: '早退', 值: stats.earlyLeave },
        { 字段: '旷课', 值: stats.absent },
        { 字段: '请假', 值: stats.leave },
        { 字段: '导出时间', 值: dayjs().format('YYYY-MM-DD HH:mm:ss') },
    ];
};

const buildSummaryRows = (records: AttendanceRecord[], reportType: AttendanceReportType) => (
    reportType === 'personal'
        ? buildPersonalSummaryRows(records)
        : reportType === 'class'
            ? buildClassSummaryRows(records)
            : buildGradeSummaryRows(records)
);

const applySheetStyles = (sheet: XLSX.WorkSheet, widths: number[]) => {
    sheet['!cols'] = widths.map((width) => ({ wch: width }));
};

const buildAttendancePdfHtml = (
    filename: string,
    reportType: AttendanceReportType,
    overviewRows: Array<Record<string, unknown>>,
    summaryRows: Array<Record<string, unknown>>,
    detailRows: Array<Record<string, unknown>>,
) => `
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
    .meta { margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="page">
    <h1>${escapeHtml(reportTypeLabels[reportType])}考勤报表</h1>
    <p class="meta">导出文件：${escapeHtml(filename)}</p>
    ${rowsToHtmlTable('导出信息', overviewRows)}
    ${rowsToHtmlTable('汇总', summaryRows)}
    ${rowsToHtmlTable('明细', detailRows)}
  </div>
</body>
</html>`;

export const exportAttendanceExcel = (
    records: AttendanceRecord[],
    options: AttendanceExportOptions,
): string => {
    const workbook = XLSX.utils.book_new();

    const overviewSheet = XLSX.utils.json_to_sheet(buildOverviewRows(records, options));
    applySheetStyles(overviewSheet, [18, 30]);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, '导出信息');

    const summarySheet = XLSX.utils.json_to_sheet(buildSummaryRows(records, options.reportType));
    applySheetStyles(summarySheet, [14, 14, 12, 12, 10, 10, 10, 10, 10, 10]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, '汇总');

    const detailSheet = XLSX.utils.json_to_sheet(buildDetailRows(records));
    applySheetStyles(detailSheet, [14, 14, 14, 10, 10, 12, 12, 12, 10, 24]);
    XLSX.utils.book_append_sheet(workbook, detailSheet, '明细');

    const filename = `${reportTypeLabels[options.reportType]}考勤报表_${getExportScope(options)}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    XLSX.writeFile(workbook, filename);
    return filename;
};

export const exportAttendancePdf = async (
    records: AttendanceRecord[],
    options: AttendanceExportOptions,
): Promise<string> => {
    const filename = `${reportTypeLabels[options.reportType]}考勤报表_${getExportScope(options)}_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`;
    const overviewRows = buildOverviewRows(records, options);
    const summaryRows = buildSummaryRows(records, options.reportType);
    const detailRows = buildDetailRows(records);
    const html = buildAttendancePdfHtml(filename, options.reportType, overviewRows, summaryRows, detailRows);

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

        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            compress: true,
        });

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
