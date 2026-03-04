import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  List,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { mockStudents } from '@/mock/users';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addStudentsToCourse,
  deleteCourse,
  fetchCourses,
  fetchCourseStudents,
  removeStudentFromCourse,
  studentJoinCourse,
} from '@/store/slices/courseSlice';
import type { Course } from '@/types';
import './CourseList.css';

const { Title, Text, Paragraph } = Typography;

type StudentScope = 'joined' | 'discover';

const CourseList = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { courses, loading, total, students } = useAppSelector((state) => state.course);

  const [keyword, setKeyword] = useState('');
  const [scope, setScope] = useState<StudentScope>('joined');
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const loadCourses = async (nextKeyword = keyword, nextScope = scope) => {
    const queryScope = user?.role === 'teacher' ? 'mine' : nextScope;

    await dispatch(
      fetchCourses({
        page: 1,
        pageSize: 12,
        keyword: nextKeyword,
        scope: queryScope,
      })
    );
  };

  useEffect(() => {
    void loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, user?.id, scope]);

  const handleSearch = () => {
    void loadCourses(keyword, scope);
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await dispatch(deleteCourse(courseId)).unwrap();
      message.success('课程已删除');
      await loadCourses();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '删除失败');
    }
  };

  const handleJoinCourse = async (courseId: string) => {
    try {
      await dispatch(studentJoinCourse(courseId)).unwrap();
      message.success('加入课程成功');
      setScope('joined');
      await loadCourses(keyword, 'joined');
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '加入课程失败');
    }
  };

  const openStudentModal = async (course: Course) => {
    setSelectedCourse(course);
    setStudentModalOpen(true);
    setSelectedStudentIds([]);
    await dispatch(fetchCourseStudents(course.id));
  };

  const candidateStudents = useMemo(() => {
    const joinedSet = new Set(students.map((item) => item.studentId));
    return mockStudents.filter((item) => !joinedSet.has(item.id));
  }, [students]);

  const handleAddStudents = async () => {
    if (!selectedCourse || selectedStudentIds.length === 0) {
      return;
    }

    try {
      await dispatch(
        addStudentsToCourse({
          courseId: selectedCourse.id,
          studentIds: selectedStudentIds,
        })
      ).unwrap();
      message.success('已拉取学生加入课程');
      setSelectedStudentIds([]);
      await dispatch(fetchCourseStudents(selectedCourse.id));
      await loadCourses();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '操作失败');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedCourse) {
      return;
    }

    try {
      await dispatch(removeStudentFromCourse({ courseId: selectedCourse.id, studentId })).unwrap();
      message.success('已移除学生');
      await dispatch(fetchCourseStudents(selectedCourse.id));
      await loadCourses();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '移除失败');
    }
  };

  return (
    <div className="course-list-page">
      <div className="page-header">
        <div>
          <Title level={3} className="page-title">
            课程系统
          </Title>
          <Text type="secondary">
            {user?.role === 'teacher'
              ? '创建、编辑、删除课程并维护课程学生。'
              : '查看已加入课程，或加入公开课程。'}
          </Text>
        </div>
        {user?.role === 'teacher' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/courses/create')}>
            创建课程
          </Button>
        )}
      </div>

      <div className="course-toolbar">
        <Space wrap>
          <Input.Search
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={handleSearch}
            placeholder="搜索课程名称/描述/学科"
            className="course-search"
          />
          {user?.role === 'student' && (
            <Segmented
              options={[
                { label: '我的课程', value: 'joined' },
                { label: '公开课程', value: 'discover' },
              ]}
              value={scope}
              onChange={(value) => setScope(value as StudentScope)}
            />
          )}
        </Space>
      </div>

      {courses.length === 0 && !loading ? (
        <Empty description={user?.role === 'teacher' ? '暂无课程，请先创建课程' : '暂无课程'} />
      ) : (
        <Row gutter={[16, 16]}>
          {courses.map((course) => (
            <Col key={course.id} xs={24} md={12} xl={8}>
              <Card
                className="course-card"
                title={<span>{course.name}</span>}
                extra={
                  <Tag color={course.visibility === 'public' ? 'green' : 'orange'}>
                    {course.visibility === 'public' ? '公开' : '私有'}
                  </Tag>
                }
              >
                <Paragraph className="course-card-desc" ellipsis={{ rows: 2 }}>
                  {course.description || '暂无描述'}
                </Paragraph>

                <Space size={[6, 6]} wrap>
                  <Tag>{course.subject}</Tag>
                  <Tag>{course.grade}</Tag>
                  <Tag>{course.class}</Tag>
                  <Tag color="blue">{course.chapters.length} 章</Tag>
                  <Tag color="purple">{course.studentCount} 人</Tag>
                </Space>

                <div className="course-actions">
                  <Button icon={<EyeOutlined />} onClick={() => navigate(`/courses/${course.id}`)}>
                    查看
                  </Button>

                  {user?.role === 'teacher' ? (
                    <>
                      <Button icon={<EditOutlined />} onClick={() => navigate(`/courses/${course.id}/edit`)}>
                        编辑
                      </Button>
                      <Button icon={<TeamOutlined />} onClick={() => void openStudentModal(course)}>
                        学生
                      </Button>
                      <Popconfirm
                        title="确认删除课程？"
                        description="删除后课程与章节内容将从本地演示数据移除。"
                        okText="删除"
                        cancelText="取消"
                        onConfirm={() => void handleDeleteCourse(course.id)}
                      >
                        <Button danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>
                    </>
                  ) : (
                    scope === 'discover' && (
                      <Button type="primary" icon={<UserAddOutlined />} onClick={() => void handleJoinCourse(course.id)}>
                        加入课程
                      </Button>
                    )
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <div className="course-footer">共 {total} 门课程</div>

      <Modal
        title={selectedCourse ? `学生管理 - ${selectedCourse.name}` : '学生管理'}
        open={studentModalOpen}
        onCancel={() => setStudentModalOpen(false)}
        footer={null}
        width={700}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space.Compact style={{ width: '100%' }}>
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="选择需要拉取加入课程的学生"
              value={selectedStudentIds}
              onChange={setSelectedStudentIds}
              options={candidateStudents.map((student) => ({
                label: `${student.realName} (${student.username})`,
                value: student.id,
              }))}
            />
            <Button type="primary" onClick={() => void handleAddStudents()}>
              拉取加入
            </Button>
          </Space.Compact>

          <List
            bordered
            locale={{ emptyText: '暂无已加入学生' }}
            dataSource={students}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key="remove"
                    type="link"
                    danger
                    onClick={() => void handleRemoveStudent(item.studentId)}
                  >
                    移除
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={`${item.studentName} (${item.studentNo})`}
                  description={`加入时间：${new Date(item.joinedAt).toLocaleString()}，学习进度 ${item.progress}%`}
                />
              </List.Item>
            )}
          />
        </Space>
      </Modal>
    </div>
  );
};

export default CourseList;
