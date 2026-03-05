import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Upload,
  Typography,
  message,
} from 'antd';
import type { UploadFile } from 'antd';
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createCourse, updateCourse } from '@/store/slices/courseSlice';
import type { CourseResource, CreateCourseParams } from '@/types';
import { generateId } from '@/utils/generator';
import './CourseCreate.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

const gradeOptions = ['初一', '初二', '初三', '高一', '高二', '高三'];
const classOptions = ['1班', '2班', '3班', '4班', '选修'];
const subjectOptions = ['语文', '数学', '英语', '物理', '化学', '多媒体', '日语'];

type DraftResource = {
  id: string;
  name: string;
  type: CourseResource['type'];
  size: number;
  url: string;
};

type DraftChapter = {
  id: string;
  title: string;
  description?: string;
  resources: DraftResource[];
};

const mapFileType = (name: string): CourseResource['type'] => {
  const lower = name.toLowerCase();
  if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm')) {
    return 'video';
  }

  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) {
    return 'ppt';
  }

  if (lower.endsWith('.doc') || lower.endsWith('.docx')) {
    return 'word';
  }

  if (lower.endsWith('.pdf')) {
    return 'pdf';
  }

  return 'other';
};

const CourseCreate = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  const [chapters, setChapters] = useState<DraftChapter[]>([]);
  const [saving, setSaving] = useState(false);
  const { allCourses } = useAppSelector((state) => state.course);

  const editingCourse = useMemo(
    () => allCourses.find((course) => course.id === id),
    [allCourses, id]
  );

  useEffect(() => {
    if (!isEdit || !editingCourse) {
      return;
    }

    form.setFieldsValue({
      name: editingCourse.name,
      description: editingCourse.description,
      grade: editingCourse.grade,
      class: editingCourse.class,
      subject: editingCourse.subject,
      visibility: editingCourse.visibility,
      status: editingCourse.status,
    });

    setChapters(
      editingCourse.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        resources: chapter.resources.map((resource) => ({
          id: resource.id,
          name: resource.name,
          type: resource.type,
          size: resource.size,
          url: resource.url,
        })),
      }))
    );
  }, [editingCourse, form, isEdit]);

  const addChapter = () => {
    setChapters((prev) => [
      ...prev,
      {
        id: generateId(),
        title: '',
        description: '',
        resources: [],
      },
    ]);
  };

  const updateChapterField = (chapterId: string, key: 'title' | 'description', value: string) => {
    setChapters((prev) =>
      prev.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, [key]: value } : chapter
      )
    );
  };

  const removeChapter = (chapterId: string) => {
    setChapters((prev) => prev.filter((chapter) => chapter.id !== chapterId));
  };

  const addResources = (chapterId: string, files: UploadFile[]) => {
    const mapped: DraftResource[] = files
      .filter((file) => file.originFileObj)
      .map((file) => ({
        id: generateId(),
        name: file.name,
        type: mapFileType(file.name),
        size: file.size ?? 0,
        url: `/mock/uploads/${file.name}`,
      }));

    setChapters((prev) =>
      prev.map((chapter) =>
        chapter.id === chapterId
          ? {
              ...chapter,
              resources: [...chapter.resources, ...mapped],
            }
          : chapter
      )
    );
  };

  const removeResource = (chapterId: string, resourceId: string) => {
    setChapters((prev) =>
      prev.map((chapter) =>
        chapter.id === chapterId
          ? {
              ...chapter,
              resources: chapter.resources.filter((resource) => resource.id !== resourceId),
            }
          : chapter
      )
    );
  };

  const handleSubmit = async (values: Omit<CreateCourseParams, 'chapters'>) => {
    const emptyChapter = chapters.find((chapter) => !chapter.title.trim());
    if (emptyChapter) {
      message.warning('请填写完整章节名称');
      return;
    }

    const payload: CreateCourseParams = {
      ...values,
      chapters: chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        resources: chapter.resources,
      })),
    };

    setSaving(true);
    try {
      if (isEdit && id) {
        await dispatch(updateCourse({ id, ...payload })).unwrap();
        message.success('课程已更新');
      } else {
        await dispatch(createCourse(payload)).unwrap();
        message.success('课程已创建');
      }

      navigate('/courses');
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="course-create-page">
      <div className="course-create-header">
        <Title level={3}>{isEdit ? '编辑课程' : '创建课程'}</Title>
        <Text type="secondary">支持配置章节并导入 MP4、PPT、Word、PDF 等教学资料。</Text>
      </div>

      <Card>
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          initialValues={{ visibility: 'public', status: 'draft' }}
        >
          <div className="form-grid">
            <Form.Item label="课程名称" name="name" rules={[{ required: true, message: '请输入课程名称' }]}>
              <Input placeholder="例如：高一物理力学基础" />
            </Form.Item>
            <Form.Item label="学科" name="subject" rules={[{ required: true, message: '请选择学科' }]}>
              <Select
                placeholder="请选择学科"
                options={subjectOptions.map((item) => ({ label: item, value: item }))}
              />
            </Form.Item>
            <Form.Item label="年级" name="grade" rules={[{ required: true, message: '请选择年级' }]}>
              <Select
                placeholder="请选择年级"
                options={gradeOptions.map((item) => ({ label: item, value: item }))}
              />
            </Form.Item>
            <Form.Item label="班级" name="class" rules={[{ required: true, message: '请选择班级' }]}>
              <Select
                placeholder="请选择班级"
                options={classOptions.map((item) => ({ label: item, value: item }))}
              />
            </Form.Item>
            <Form.Item label="公开范围" name="visibility" rules={[{ required: true }]}>
              <Select
                options={[
                  { label: '公开课程（学生可自行加入）', value: 'public' },
                  { label: '私有课程（仅教师拉取学生）', value: 'private' },
                  { label: '班级可见', value: 'class_only' },
                ]}
              />
            </Form.Item>
            <Form.Item label="课程状态" name="status" rules={[{ required: true }]}>
              <Select
                options={[
                  { label: '草稿', value: 'draft' },
                  { label: '进行中', value: 'active' },
                  { label: '归档', value: 'archived' },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item label="课程简介" name="description">
            <TextArea rows={4} placeholder="简要介绍课程目标、适用对象与学习安排" />
          </Form.Item>

          <div className="chapter-section">
            <div className="chapter-header">
              <Title level={5}>章节内容</Title>
              <Button icon={<PlusOutlined />} onClick={addChapter}>
                添加章节
              </Button>
            </div>

            {chapters.length === 0 ? (
              <Card size="small" className="empty-chapter-card">
                暂无章节，点击“添加章节”开始配置课程内容。
              </Card>
            ) : (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {chapters.map((chapter, index) => (
                  <Card
                    key={chapter.id}
                    size="small"
                    title={`第 ${index + 1} 章`}
                    extra={
                      <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeChapter(chapter.id)}>
                        删除章节
                      </Button>
                    }
                  >
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      <Input
                        placeholder="章节名称"
                        value={chapter.title}
                        onChange={(event) =>
                          updateChapterField(chapter.id, 'title', event.target.value)
                        }
                      />
                      <TextArea
                        rows={2}
                        placeholder="章节描述（可选）"
                        value={chapter.description}
                        onChange={(event) =>
                          updateChapterField(chapter.id, 'description', event.target.value)
                        }
                      />

                      <Upload
                        multiple
                        beforeUpload={() => false}
                        showUploadList={false}
                        onChange={({ fileList }) => addResources(chapter.id, fileList)}
                        accept=".mp4,.mov,.webm,.ppt,.pptx,.doc,.docx,.pdf"
                      >
                        <Button icon={<UploadOutlined />}>导入教学文件</Button>
                      </Upload>

                      <div className="resource-list">
                        {chapter.resources.map((resource) => (
                          <Tag
                            key={resource.id}
                            closable
                            onClose={(event) => {
                              event.preventDefault();
                              removeResource(chapter.id, resource.id);
                            }}
                            color="blue"
                          >
                            {resource.name}
                          </Tag>
                        ))}
                      </div>
                    </Space>
                  </Card>
                ))}
              </Space>
            )}
          </div>

          <div className="course-form-actions">
            <Button onClick={() => navigate('/courses')}>取消</Button>
            <Button htmlType="submit" type="primary" loading={saving}>
              {isEdit ? '保存修改' : '创建课程'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CourseCreate;
