export type CheckInStatus = 'checked' | 'unchecked' | 'late';

export interface Classroom {
    id: string;
    courseId: string;
    courseName: string;
    teacherId: string;
    teacherName: string;
    status: 'active' | 'ended';
    startTime: string;
    endTime?: string;
    checkInRecords: CheckInRecord[];
    interactions: ClassroomInteraction[];
    randomPickRecords: RandomPickRecord[];
}

export interface CheckInRecord {
    id: string;
    classroomId: string;
    studentId: string;
    studentName: string;
    studentNo: string;
    status: CheckInStatus;
    checkInTime?: string;
    createdAt: string;
}

export interface CheckInSession {
    id: string;
    classroomId: string;
    duration: number;
    qrcode?: string;
    status: 'active' | 'ended';
    startTime: string;
    endTime?: string;
    records: CheckInRecord[];
}

export interface ClassroomInteraction {
    id: string;
    classroomId: string;
    topic?: string;
    senderId: string;
    senderName: string;
    senderRole: 'teacher' | 'student';
    content: string;
    createdAt: string;
}

export interface RandomPickRecord {
    id: string;
    classroomId: string;
    studentIds: string[];
    studentNames: string[];
    pickedAt: string;
}

export interface StartClassroomParams {
    courseId: string;
}

export interface StartCheckInParams {
    classroomId: string;
    duration: number;
}

export interface SendMessageParams {
    classroomId: string;
    content: string;
    topic?: string;
}
