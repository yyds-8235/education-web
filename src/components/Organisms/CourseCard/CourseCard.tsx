import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from 'antd';
import {
    MoreOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    VideoCameraOutlined,
    BookOutlined,
} from '@ant-design/icons';
import { Avatar, Badge } from '@/components/Atoms';
import type { Course } from '@/types';
import './CourseCard.css';

export interface CourseCardProps {
    course: Course;
    onEdit?: (course: Course) => void;
    onDelete?: (course: Course) => void;
    onViewStudents?: (course: Course) => void;
    onStartClass?: (course: Course) => void;
    onView?: (course: Course) => void;
    showActions?: boolean;
    className?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({
    course,
    onEdit,
    onDelete,
    onViewStudents,
    onStartClass,
    onView,
    showActions = true,
    className = '',
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onView) {
            onView(course);
        } else {
            navigate(`/courses/${course.id}`);
        }
    };

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const menuItems = [
        {
            key: 'edit',
            icon: <EditOutlined />,
            label: '编辑课程',
            onClick: () => onEdit?.(course),
        },
        {
            key: 'students',
            icon: <UserOutlined />,
            label: '学生管理',
            onClick: () => onViewStudents?.(course),
        },
        {
            key: 'start',
            icon: <VideoCameraOutlined />,
            label: '开始授课',
            onClick: () => onStartClass?.(course),
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '删除课程',
            danger: true,
            onClick: () => onDelete?.(course),
        },
    ];

    const getStatusBadge = () => {
        switch (course.status) {
            case 'active':
                return <Badge variant="success">进行中</Badge>;
            case 'archived':
                return <Badge variant="neutral">已归档</Badge>;
            case 'draft':
                return <Badge variant="warning">草稿</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className={`course-card ${className}`} onClick={handleClick}>
            <div className="course-card-cover">
                {course.coverImage ? (
                    <img src={course.coverImage} alt={course.name} />
                ) : (
                    <div className="course-card-cover-placeholder">
                        <BookOutlined />
                    </div>
                )}
                <div className="course-card-status">{getStatusBadge()}</div>
            </div>

            <div className="course-card-content">
                <div className="course-card-header">
                    <h3 className="course-card-title">{course.name}</h3>
                    {showActions && (
                        <Dropdown
                            menu={{ items: menuItems }}
                            trigger={['click']}
                            placement="bottomRight"
                        >
                            <button className="course-card-more" onClick={handleActionClick}>
                                <MoreOutlined />
                            </button>
                        </Dropdown>
                    )}
                </div>

                <p className="course-card-description">{course.description || '暂无描述'}</p>

                <div className="course-card-meta">
                    <span className="course-card-subject">{course.subject}</span>
                    <span className="course-card-grade">
                        {course.grade} · {course.class}
                    </span>
                </div>

                <div className="course-card-footer">
                    <div className="course-card-teacher">
                        <Avatar name={course.teacherName} size="small" />
                        <span>{course.teacherName}</span>
                    </div>
                    <div className="course-card-stats">
                        <span>
                            <UserOutlined /> {course.studentCount}人
                        </span>
                        <span>
                            <BookOutlined /> {course.chapters.length}章节
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
