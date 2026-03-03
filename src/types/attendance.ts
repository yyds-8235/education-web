export type AttendanceType = 'present' | 'late' | 'early_leave' | 'absent' | 'leave';

export interface AttendanceRecord {
    id: string;
    studentId: string;
    studentName: string;
    studentNo: string;
    grade: string;
    class: string;
    date: string;
    type: AttendanceType;
    checkInTime?: string;
    checkOutTime?: string;
    isException: boolean;
    exceptionNote?: string;
    createdAt: string;
}

export interface AttendanceStatistics {
    studentId: string;
    studentName: string;
    studentNo: string;
    totalDays: number;
    presentDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    absentDays: number;
    leaveDays: number;
    attendanceRate: number;
}

export interface ClassAttendanceReport {
    grade: string;
    class: string;
    date: string;
    totalStudents: number;
    presentCount: number;
    lateCount: number;
    earlyLeaveCount: number;
    absentCount: number;
    leaveCount: number;
    records: AttendanceRecord[];
}

export interface GradeAttendanceReport {
    grade: string;
    date: string;
    classReports: ClassAttendanceReport[];
    totalStudents: number;
    presentCount: number;
    lateCount: number;
    earlyLeaveCount: number;
    absentCount: number;
    leaveCount: number;
}

export interface AttendanceQueryParams {
    startDate: string;
    endDate: string;
    grade?: string;
    class?: string;
    studentId?: string;
    type?: AttendanceType;
    page?: number;
    pageSize?: number;
}
