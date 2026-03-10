﻿import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  List,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  endCheckIn,
  endClassroom,
  fetchClassroom,
  randomPick,
  sendMessage,
  startCheckIn,
  startClassroom,
  studentCheckIn,
} from '@/store/slices/classroomSlice';
import './Classroom.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

const Classroom = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { allCourses, courseStudentMap } = useAppSelector((state) => state.course);
  const { classrooms, currentClassroom, activeCheckInSession, interactions, randomPickRecords } =
    useAppSelector((state) => state.classroom);

  const [selectedCourseId, setSelectedCourseId] = useState<string>();
  const [checkInDuration, setCheckInDuration] = useState<number>(10);
  const [messageTopic, setMessageTopic] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [pickCount, setPickCount] = useState<number>(1);

  const teacherCourses = useMemo(() => {
    if (!user || user.role !== 'teacher') {
      return [];
    }

    return allCourses.filter((course) => course.teacherId === user.id);
  }, [allCourses, user]);

  const studentAvailableClassrooms = useMemo(() => {
    if (!user || user.role !== 'student') {
      return [];
    }

    return classrooms.filter((classroom) => {
      if (classroom.status !== 'active') {
        return false;
      }

      return (courseStudentMap[classroom.courseId] ?? []).some(
        (student) => student.studentId === user.id
      );
    });
  }, [classrooms, courseStudentMap, user]);

  useEffect(() => {
    if (currentClassroom) {
      setSelectedCourseId(currentClassroom.courseId);
    }
  }, [currentClassroom]);

  const handleStartClassroom = async () => {
    if (!selectedCourseId) {
      message.warning('请先选择课程');
      return;
    }

    try {
      const result = await dispatch(startClassroom({ courseId: selectedCourseId })).unwrap();
      await dispatch(fetchClassroom(result.id));
      message.success('授课已发起');
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '发起授课失败');
    }
  };

  const handleSelectClassroom = async (classroomId: string) => {
    try {
      await dispatch(fetchClassroom(classroomId)).unwrap();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '课堂加载失败');
    }
  };

  const handleStartCheckIn = async () => {
    if (!currentClassroom) {
      message.warning('请先发起授课');
      return;
    }

    try {
      await dispatch(startCheckIn({ classroomId: currentClassroom.id, duration: checkInDuration })).unwrap();
      message.success('签到已发起');
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '发起签到失败');
    }
  };

  const handleStudentCheckIn = async () => {
    if (!currentClassroom || !activeCheckInSession) {
      message.warning('教师尚未发起签到');
      return;
    }

    try {
      await dispatch(
        studentCheckIn({
          classroomId: currentClassroom.id,
          sessionId: activeCheckInSession.id,
        })
      ).unwrap();
      message.success('签到成功');
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '签到失败');
    }
  };

  const handleSendMessage = async () => {
    if (!currentClassroom || !messageContent.trim()) {
      return;
    }

    try {
      await dispatch(
        sendMessage({
          classroomId: currentClassroom.id,
          topic: messageTopic.trim() || undefined,
          content: messageContent.trim(),
        })
      ).unwrap();
      setMessageContent('');
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '发送失败');
    }
  };

  const handleRandomPick = async () => {
    if (!currentClassroom) {
      return;
    }

    try {
      const record = await dispatch(
        randomPick({ classroomId: currentClassroom.id, count: pickCount })
      ).unwrap();
      message.success(`随机选中：${record.studentNames.join('、')}`);
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '随机选人失败');
    }
  };

  const handleEndCheckIn = async () => {
    if (!currentClassroom || !activeCheckInSession) {
      return;
    }

    try {
      await dispatch(
        endCheckIn({ classroomId: currentClassroom.id, sessionId: activeCheckInSession.id })
      ).unwrap();
      message.success('签到已结束');
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '结束签到失败');
    }
  };

  const handleEndClassroom = async () => {
    if (!currentClassroom) {
      return;
    }

    try {
      await dispatch(endClassroom(currentClassroom.id)).unwrap();
      message.success('授课已结束');
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '结束授课失败');
    }
  };

  const checkInData = activeCheckInSession?.records ?? currentClassroom?.checkInRecords ?? [];

  return (
    <div className="classroom-page">
      <div className="classroom-header">
        <div>
          <Title level={3}>授课系统</Title>
          <Text type="secondary">发起授课、课堂签到、话题互动与随机选人。</Text>
        </div>
      </div>

      <Card>
        {user?.role === 'teacher' ? (
          <Space wrap>
            <Select
              style={{ minWidth: 260 }}
              placeholder="选择要授课的课程"
              value={selectedCourseId}
              onChange={setSelectedCourseId}
              options={teacherCourses.map((course) => ({ label: course.name, value: course.id }))}
            />
            <Button type="primary" onClick={() => void handleStartClassroom()}>
              发起授课
            </Button>
            {currentClassroom && currentClassroom.status === 'active' && (
              <Button danger onClick={() => void handleEndClassroom()}>
                结束授课
              </Button>
            )}
          </Space>
        ) : (
          <Space wrap>
            <Select
              style={{ minWidth: 260 }}
              placeholder="选择可加入的课堂"
              value={currentClassroom?.id}
              onChange={(value) => void handleSelectClassroom(value)}
              options={studentAvailableClassrooms.map((classroom) => ({
                label: `${classroom.courseName}（${classroom.teacherName}）`,
                value: classroom.id,
              }))}
            />
            <Button
              type="primary"
              onClick={() => void handleStudentCheckIn()}
              disabled={!activeCheckInSession || activeCheckInSession.status !== 'active'}
            >
              课堂签到
            </Button>
          </Space>
        )}
      </Card>

      {!currentClassroom ? (
        <Empty description="暂无进行中的课堂" />
      ) : (
        <>
          <Card
            title={
              <Space>
                <span>{currentClassroom.courseName}</span>
                <Badge
                  status={currentClassroom.status === 'active' ? 'processing' : 'default'}
                  text={currentClassroom.status === 'active' ? '授课中' : '已结束'}
                />
              </Space>
            }
          >
            <Text type="secondary">教师：{currentClassroom.teacherName}</Text>
            <br />
            <Text type="secondary">开始时间：{dayjs(currentClassroom.startTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
          </Card>

          {user?.role === 'teacher' && (
            <Card title="课堂签到">
              <Space wrap style={{ marginBottom: 12 }}>
                <InputNumber
                  min={1}
                  max={60}
                  value={checkInDuration}
                  onChange={(value) => setCheckInDuration(value ?? 10)}
                  addonAfter="分钟"
                />
                <Button type="primary" onClick={() => void handleStartCheckIn()}>
                  发起签到
                </Button>
                <Button onClick={() => void handleEndCheckIn()} disabled={!activeCheckInSession}>
                  结束签到
                </Button>
              </Space>

              <Table
                size="small"
                rowKey="id"
                dataSource={checkInData}
                pagination={false}
                columns={[
                  { title: '学生', dataIndex: 'studentName' },
                  { title: '学号', dataIndex: 'studentNo' },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    render: (value: string) => (
                      <Tag color={value === 'checked' ? 'green' : value === 'late' ? 'orange' : 'default'}>
                        {value === 'checked' ? '已签到' : value === 'late' ? '迟到' : '未签到'}
                      </Tag>
                    ),
                  },
                  {
                    title: '签到时间',
                    dataIndex: 'checkInTime',
                    render: (value?: string) => (value ? dayjs(value).format('HH:mm:ss') : '-'),
                  },
                ]}
                locale={{ emptyText: '暂无签到记录' }}
              />
            </Card>
          )}

          <Card title="课堂互动">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Input
                placeholder="互动话题（可选）"
                value={messageTopic}
                onChange={(event) => setMessageTopic(event.target.value)}
              />
              <TextArea
                rows={3}
                placeholder="输入发言内容"
                value={messageContent}
                onChange={(event) => setMessageContent(event.target.value)}
              />
              <Button type="primary" onClick={() => void handleSendMessage()}>
                发送发言
              </Button>

              <List
                className="interaction-list"
                bordered
                locale={{ emptyText: '暂无互动消息' }}
                dataSource={[...interactions].reverse()}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color={item.senderRole === 'teacher' ? 'blue' : 'green'}>
                            {item.senderRole === 'teacher' ? '教师' : '学生'}
                          </Tag>
                          <span>{item.senderName}</span>
                          {item.topic && <Tag>{item.topic}</Tag>}
                          <Text type="secondary">{dayjs(item.createdAt).format('HH:mm:ss')}</Text>
                        </Space>
                      }
                      description={item.content}
                    />
                  </List.Item>
                )}
              />
            </Space>
          </Card>

          {user?.role === 'teacher' && (
            <Card title="课堂随机选人">
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Space>
                  <InputNumber
                    min={1}
                    max={10}
                    value={pickCount}
                    onChange={(value) => setPickCount(value ?? 1)}
                    addonAfter="人"
                  />
                  <Button type="primary" onClick={() => void handleRandomPick()}>
                    随机抽取
                  </Button>
                </Space>

                <List
                  bordered
                  locale={{ emptyText: '尚未进行随机选人' }}
                  dataSource={randomPickRecords}
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" size={2}>
                        <Text>{item.studentNames.join('、')}</Text>
                        <Text type="secondary">{dayjs(item.pickedAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </Space>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Classroom;
