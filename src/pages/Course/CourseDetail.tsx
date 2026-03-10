import { useEffect, useMemo } from 'react';
import {
  Button,
  Card,
  Collapse,
  Descriptions,
  Empty,
  List,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { DownloadOutlined, EditOutlined, EyeOutlined, FileOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCourseById, fetchCourseStudents, studentJoinCourse } from '@/store/slices/courseSlice';
import type { CourseResource } from '@/types';
import { getCourseResourceDownloadUrlApi, getCourseResourcePreviewUrlApi } from '@/services/course';
import './CourseDetail.css';

const { Title, Text, Paragraph } = Typography;

const resourceTypeLabel: Record<CourseResource['type'], string> = {
  video: 'MP4 视频',
  ppt: 'PPT 课件',
  word: 'Word 文档',
  pdf: 'PDF 文档',
  other: '其他文件',
};

const resourcePreviewLabel: Record<CourseResource['type'], string> = {
  video: '在线播放',
  ppt: '在线预览',
  word: '在线预览',
  pdf: '在线预览',
  other: '预览文件',
};

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { allCourses, currentCourse, courseStudentMap } = useAppSelector((state) => state.course);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!id) {
      return;
    }

    void dispatch(fetchCourseById(id));
    void dispatch(fetchCourseStudents(id));
  }, [dispatch, id]);

  const course = useMemo(
    () => currentCourse ?? allCourses.find((item) => item.id === id),
    [allCourses, currentCourse, id]
  );

  const hasJoined = useMemo(() => {
    if (!user || user.role !== 'student' || !course) {
      return false;
    }

    return (courseStudentMap[course.id] ?? []).some((student) => student.studentId === user.id);
  }, [course, courseStudentMap, user]);

  const handleJoin = async () => {
    if (!course) {
      return;
    }

    try {
      await dispatch(studentJoinCourse(course.id)).unwrap();
      messageApi.success('加入课程成功');
      await dispatch(fetchCourseStudents(course.id));
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '加入失败');
    }
  };

  const openUrlInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePreviewResource = async (resource: CourseResource) => {
    try {
      const response = await getCourseResourcePreviewUrlApi(resource.id);
      openUrlInNewTab(response.url);
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '获取预览地址失败');
    }
  };

  const handleDownloadResource = async (resource: CourseResource) => {
    try {
      const response = await getCourseResourceDownloadUrlApi(resource.id);
      const anchor = document.createElement('a');
      anchor.href = response.url;
      anchor.download = response.fileName || resource.name;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '获取下载地址失败');
    }
  };

  if (!course) {
    return <Empty description="课程不存在" />;
  }

  return (
    <div className="course-detail-page">
      {contextHolder}
      <div className="course-detail-header">
        <div>
          <Title level={3}>{course.name}</Title>
          <Paragraph type="secondary">{course.description || '暂无课程描述'}</Paragraph>
        </div>

        <Space>
          {user?.role === 'teacher' && (
            <Button icon={<EditOutlined />} onClick={() => navigate(`/courses/${course.id}/edit`)}>
              编辑课程
            </Button>
          )}
          {user?.role === 'student' && !hasJoined && course.visibility === 'public' && (
            <Button type="primary" icon={<UserAddOutlined />} onClick={() => void handleJoin()}>
              加入课程
            </Button>
          )}
          <Button onClick={() => navigate('/courses')}>返回列表</Button>
        </Space>
      </div>

      <Card>
        <Descriptions column={{ xs: 1, md: 2, lg: 4 }}>
          <Descriptions.Item label="授课教师">{course.teacherName}</Descriptions.Item>
          <Descriptions.Item label="学科">{course.subject}</Descriptions.Item>
          <Descriptions.Item label="年级班级">
            {course.grade} / {course.class}
          </Descriptions.Item>
          <Descriptions.Item label="公开范围">
            <Tag color={course.visibility === 'public' ? 'green' : 'orange'}>
              {course.visibility === 'public' ? '公开' : '私有'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="课程状态">
            <Tag color={course.status === 'active' ? 'blue' : course.status === 'draft' ? 'default' : 'purple'}>
              {course.status === 'active' ? '进行中' : course.status === 'draft' ? '草稿' : '归档'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="学生人数">{course.studentCount}</Descriptions.Item>
          <Descriptions.Item label="章节数量">{course.chapters.length}</Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(course.updatedAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="章节内容">
        {course.chapters.length === 0 ? (
          <Empty description="暂无章节内容" />
        ) : (
          <Collapse
            accordion
            items={course.chapters.map((chapter) => ({
              key: chapter.id,
              label: `${chapter.order}. ${chapter.title}`,
              children: (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Text type="secondary">{chapter.description || '暂无章节说明'}</Text>
                  {chapter.resources.length === 0 ? (
                    <Text type="secondary">暂无教学文件</Text>
                  ) : (
                    <List
                      size="small"
                      bordered
                      dataSource={chapter.resources}
                      renderItem={(resource) => (
                        <List.Item
                          className="course-resource-item"
                          actions={[
                            <Button
                              key="preview"
                              type="link"
                              icon={<EyeOutlined />}
                              onClick={() => void handlePreviewResource(resource)}
                            >
                              {resourcePreviewLabel[resource.type]}
                            </Button>,
                            <Button
                              key="download"
                              type="link"
                              icon={<DownloadOutlined />}
                              onClick={() => void handleDownloadResource(resource)}
                            >
                              下载
                            </Button>,
                          ]}
                        >
                          <Space className="course-resource-meta">
                            <FileOutlined />
                            <span>{resource.name}</span>
                            <Tag>{resourceTypeLabel[resource.type]}</Tag>
                            <Text type="secondary">{(resource.size / 1024 / 1024).toFixed(2)} MB</Text>
                          </Space>
                        </List.Item>
                      )}
                    />
                  )}
                </Space>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  );
};

export default CourseDetail;
