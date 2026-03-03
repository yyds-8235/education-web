import React from 'react';
import { AttendanceTable } from '@/components/Organisms';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchAttendanceRecords } from '@/store/slices/attendanceSlice';
import './Attendance.css';

const Attendance: React.FC = () => {
    const dispatch = useAppDispatch();
    const { records, loading } = useAppSelector((state) => state.attendance);

    React.useEffect(() => {
        dispatch(
            fetchAttendanceRecords({
                startDate: '2024-01-01',
                endDate: '2024-12-31',
            })
        );
    }, [dispatch]);

    const handleExport = (params: { startDate: string; endDate: string; type?: string }) => {
        console.log('Export:', params);
    };

    const handleMarkException = (recordId: string, note: string) => {
        console.log('Mark exception:', recordId, note);
    };

    return (
        <div className="attendance-page">
            <div className="page-header">
                <h1 className="page-title">考勤管理</h1>
            </div>

            <AttendanceTable
                data={records}
                loading={loading}
                onExport={handleExport}
                onMarkException={handleMarkException}
            />
        </div>
    );
};

export default Attendance;
