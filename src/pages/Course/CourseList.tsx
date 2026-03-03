import React from 'react';
import { Row, Col, Button, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchCourses } from '@/store/slices/courseSlice';
import { CourseCard } from '@/components/Organisms';
import { SearchBar } from '@/components/Molecules';
import type { Course } from '@/types';
import './CourseList.css';

const CourseList: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { courses, loading, total, pageSize } = useAppSelector((state) => state.course);
    const { user } = useAppSelector((state) => state.auth);

    React.useEffect(() => {
        dispatch(fetchCourses({ page: 1, pageSize: 10 }));
    }, [dispatch]);

    const handleSearch = (keyword: string) => {
        dispatch(fetchCourses({ page: 1, pageSize, keyword }));
    };

    const handleCreateCourse = () => {
        navigate('/courses/create');
    };

    const handleEditCourse = (course: Course) => {
        navigate(`/courses/${course.id}/edit`);
    };

    const handleViewCourse = (course: Course) => {
        navigate(`/courses/${course.id}`);
    };

    return (
        <div className="course-list-page">
            <div className="page-header">
                <h1 className="page-title">课程管理</h1>
                {user?.role === 'teacher' && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateCourse}>
                        创建课程
                    </Button>
                )}
            </div>

            <div className="page-toolbar">
                <SearchBar
                    placeholder="搜索课程名称..."
                    onSearch={handleSearch}
                    showSearchButton
                />
            </div>

            <div className="course-list-content">
                {courses.length === 0 && !loading ? (
                    <Empty description="暂无课程" />
                ) : (
                    <Row gutter={[24, 24]}>
                        {courses.map((course) => (
                            <Col key={course.id} xs={24} sm={12} lg={8} xl={6}>
                                <CourseCard
                                    course={course}
                                    onEdit={handleEditCourse}
                                    onView={handleViewCourse}
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {total > pageSize && (
                <div className="page-pagination">
                    <span>共 {total} 条记录</span>
                </div>
            )}
        </div>
    );
};

export default CourseList;
