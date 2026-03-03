export interface Schedule {
    id: string;
    grade: string;
    class: string;
    subject: string;
    teacherId: string;
    teacherName: string;
    classroom: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    weekType: 'all' | 'odd' | 'even';
    status: 'normal' | 'adjusted' | 'substituted';
    substituteTeacherId?: string;
    substituteTeacherName?: string;
    note?: string;
}

export interface ScheduleConflict {
    type: 'classroom' | 'teacher' | 'time';
    message: string;
    conflictingSchedules: Schedule[];
}

export interface TempAdjustment {
    id: string;
    originalScheduleId: string;
    newDate: string;
    newStartTime: string;
    newEndTime: string;
    newClassroom?: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

export interface SubstituteRecord {
    id: string;
    scheduleId: string;
    originalTeacherId: string;
    originalTeacherName: string;
    substituteTeacherId: string;
    substituteTeacherName: string;
    date: string;
    reason: string;
    createdAt: string;
}

export interface CreateScheduleParams {
    grade: string;
    class: string;
    subject: string;
    teacherId: string;
    classroom: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    weekType: 'all' | 'odd' | 'even';
}

export interface ScheduleQueryParams {
    grade?: string;
    class?: string;
    teacherId?: string;
    dayOfWeek?: number;
}
