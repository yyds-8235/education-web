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
  Tabs,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  CloseOutlined,
} from '@ant-design/icons';
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
const { TabPane } = Tabs;

const Classroom = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { allCourses, courseStudentMap } = useAppSelector((state) => state.course);
  const { classrooms, currentClassroom, activeCheckInSession, interactions, randomPickRecords } =
    useAppSelector((state) => state.classroom);
  const [messageApi, contextHolder] = message.useMessage();
  const [checkInEnded, setCheckInEnded] = useState<boolean>(false);

  const [selectedCourseId, setSelectedCourseId] = useState<string>();
  const [checkInDuration, setCheckInDuration] = useState<number>(10);
  const [messageContent, setMessageContent] = useState('');
  const [pickCount, setPickCount] = useState<number>(1);
  const [localCheckInData, setLocalCheckInData] = useState<any[]>([]);
  const [isPicking, setIsPicking] = useState(false);
  const [currentPicked, setCurrentPicked] = useState<string[]>([]);
  const [animationResult, setAnimationResult] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [newTopic, setNewTopic] = useState('');

  const topics = useMemo(() => {
    const topicSet = new Set<string>();
    interactions.forEach(item => {
      if (item.topic) {
        topicSet.add(item.topic);
      }
    });
    return Array.from(topicSet);
  }, [interactions]);

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

  useEffect(() => {
    const checkInData = activeCheckInSession?.records ?? currentClassroom?.checkInRecords ?? [];
    setLocalCheckInData(checkInData);
  }, [activeCheckInSession, currentClassroom]);

  useEffect(() => {
    if (!activeCheckInSession || checkInEnded) {
      setCountdown(0);
      return;
    }

    const startTime = new Date(activeCheckInSession.startTime).getTime();
    const duration = activeCheckInSession.duration * 60 * 1000;
    const endTime = startTime + duration;

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      setCountdown(remaining);
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [activeCheckInSession, checkInEnded]);

  useEffect(() => {
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [interactions, selectedTopic]);

  const handleStartClassroom = async () => {
    if (!selectedCourseId) {
      messageApi.warning('请先选择课程');
      return;
    }

    try {
      const result = await dispatch(startClassroom({ courseId: selectedCourseId })).unwrap();
      await dispatch(fetchClassroom(result.id));
      messageApi.success('授课已发起');
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '发起授课失败');
    }
  };

  const handleSelectClassroom = async (classroomId: string) => {
    try {
      await dispatch(fetchClassroom(classroomId)).unwrap();
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '课堂加载失败');
    }
  };

  const handleStartCheckIn = async () => {
    if (!currentClassroom) {
      messageApi.warning('请先发起授课');
      return;
    }

    try {
      await dispatch(startCheckIn({ classroomId: currentClassroom.id, duration: checkInDuration })).unwrap();
      setCheckInEnded(false);
      messageApi.success('签到已发起');
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '发起签到失败');
    }
  };

  const handleStudentCheckIn = async () => {
    if (!currentClassroom || !activeCheckInSession) {
      messageApi.warning('教师尚未发起签到');
      return;
    }

    try {
      await dispatch(
        studentCheckIn({
          classroomId: currentClassroom.id,
          sessionId: activeCheckInSession.id,
        })
      ).unwrap();
      messageApi.success('签到成功');
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '签到失败');
    }
  };

  const handleAddTopic = async () => {
    if (!newTopic.trim() || !currentClassroom) {
      messageApi.warning('请输入话题内容');
      return;
    }
    if (topics.includes(newTopic.trim())) {
      messageApi.warning('该话题已存在');
      return;
    }

    try {
      await dispatch(
        sendMessage({
          classroomId: currentClassroom.id,
          topic: newTopic.trim(),
          content: `创建话题：${newTopic.trim()}`,
        })
      ).unwrap();
      setNewTopic('');
      messageApi.success('话题已发布');
    } catch (error) {
      messageApi.error('发布话题失败');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    if (selectedTopic === topic) {
      setSelectedTopic('');
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
          topic: selectedTopic || undefined,
          content: messageContent.trim(),
        })
      ).unwrap();
      setMessageContent('');
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '发送失败');
    }
  };

  const handleRandomPick = async () => {
    if (!currentClassroom) {
      return;
    }

    try {
      // 模拟学生列表（实际项目中应该从API获取）
      const studentList = localCheckInData.map(item => item.studentName);
      if (studentList.length === 0) {
        messageApi.warning('暂无学生数据');
        return;
      }

      // 开始动画
      setIsPicking(true);
      setCurrentPicked([]);
      setAnimationResult('');

      // 动画持续5秒，每秒更新10次
      const animationDuration = 5000;
      const updateInterval = 100;
      const totalUpdates = animationDuration / updateInterval;

      let updateCount = 0;
      const intervalId = setInterval(() => {
        // 随机生成pickCount个学生
        const pickedStudents: string[] = [];
        for (let i = 0; i < pickCount; i++) {
          const randomIndex = Math.floor(Math.random() * studentList.length);
          pickedStudents.push(studentList[randomIndex]);
        }
        setCurrentPicked(pickedStudents);
        updateCount++;

        if (updateCount >= totalUpdates) {
          clearInterval(intervalId);
          setIsPicking(false);
        }
      }, updateInterval);

      // 5秒后调用API获取真实结果
      setTimeout(async () => {
        const record = await dispatch(
          randomPick({ classroomId: currentClassroom.id, count: pickCount })
        ).unwrap();
        setAnimationResult(record.studentNames.join('、'));
        if (record.studentNames.length < pickCount) {
          messageApi.success(`课程学生数量不足，随机选中：${record.studentNames.join('、')}`);
        } else {
          messageApi.success(`随机选中：${record.studentNames.join('、')}`);
        }
      }, animationDuration);
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '随机选人失败');
      setIsPicking(false);
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
      setCheckInEnded(true);
      messageApi.success('签到已结束');
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '结束签到失败');
    }
  };

  const handleEndClassroom = async () => {
    if (!currentClassroom) {
      return;
    }

    try {
      await dispatch(endClassroom(currentClassroom.id)).unwrap();
      messageApi.success('授课已结束');
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '结束授课失败');
    }
  };

  return (
    <div className="classroom-page">
      {contextHolder}
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

          <Card title="课堂功能">
            <Tabs>
              {user?.role === 'teacher' && (
                <TabPane tab="课堂签到" key="checkin">
                  <Space wrap style={{ marginBottom: 12 }}>
                    <InputNumber
                      min={1}
                      max={60}
                      value={checkInDuration}
                      onChange={(value) => setCheckInDuration(value ?? 10)}
                      addonAfter="分钟"
                      disabled={!!activeCheckInSession}
                    />
                    <Button 
                      type="primary" 
                      onClick={() => void handleStartCheckIn()}
                      disabled={!!activeCheckInSession}
                    >
                      发起签到
                    </Button>
                    <Button 
                      onClick={() => void handleEndCheckIn()} 
                      disabled={!activeCheckInSession}
                    >
                      结束签到
                    </Button>
                    {activeCheckInSession && !checkInEnded && countdown > 0 && (
                      <Text type="warning" style={{ fontSize: 16, fontWeight: 'bold' }}>
                        剩余时间：{Math.floor(countdown / 60)}分{countdown % 60}秒
                      </Text>
                    )}
                    {activeCheckInSession && !checkInEnded && countdown === 0 && (
                      <Text type="success" style={{ fontSize: 16, fontWeight: 'bold' }}>
                        签到时间已到
                      </Text>
                    )}
                    {checkInEnded && (
                      <Text type="success" style={{ fontSize: 16, fontWeight: 'bold' }}>
                        签到已结束
                      </Text>
                    )}
                    <Button onClick={() => {
                      if (localCheckInData.length > 0) {
                        const notCheckedStudents = localCheckInData.filter(item => item.status !== 'checked');
                        if (notCheckedStudents.length > 0) {
                          const randomIndex = Math.floor(Math.random() * notCheckedStudents.length);
                          const studentToCheck = notCheckedStudents[randomIndex];
                          const updatedCheckInData = localCheckInData.map(item => {
                            if (item.id === studentToCheck.id) {
                              return {
                                ...item,
                                status: 'checked',
                                checkInTime: new Date().toISOString()
                              };
                            }
                            return item;
                          });
                          setLocalCheckInData(updatedCheckInData);
                          messageApi.success(`刷新完成`);
                        } else {
                          messageApi.info('所有学生都已签到');
                        }
                      }
                    }} disabled={!activeCheckInSession}>
                      刷新
                    </Button>
                  </Space>

                  <Table
                    size="small"
                    rowKey="id"
                    dataSource={localCheckInData}
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
                </TabPane>
              )}
              <TabPane tab="课堂互动" key="interaction">
                <div style={{ display: 'flex', height: '600px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                  {/* 左侧：话题列表 */}
                  <div style={{ width: '280px', borderRight: '1px solid #d9d9d9', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #d9d9d9' }}>
                      <Title level={5} style={{ margin: 0 }}>话题列表</Title>
                    </div>
                    {user?.role === 'teacher' && (
                      <div style={{ padding: '12px', borderBottom: '1px solid #d9d9d9' }}>
                        <Space.Compact style={{ width: '100%' }}>
                          <Input
                            placeholder="输入新话题"
                            value={newTopic}
                            onChange={(event) => setNewTopic(event.target.value)}
                            onPressEnter={handleAddTopic}
                          />
                          <Button type="primary" onClick={handleAddTopic}>
                            发布
                          </Button>
                        </Space.Compact>
                      </div>
                    )}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                      <div
                        style={{
                          padding: '12px',
                          marginBottom: '8px',
                          borderRadius: '4px',
                          cursor: 'default',
                          backgroundColor: '#f0f0f0',
                          border: '1px solid #d9d9d9'
                        }}
                      >
                        <Text strong>全部话题</Text>
                      </div>
                      {topics.map((topic) => (
                        <div
                          key={topic}
                          style={{
                            padding: '12px',
                            marginBottom: '8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: selectedTopic === topic ? '#e6f7ff' : 'transparent',
                            border: selectedTopic === topic ? '1px solid #91d5ff' : '1px solid transparent',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onClick={() => setSelectedTopic(topic)}
                        >
                          <Text ellipsis style={{ flex: 1 }}>{topic}</Text>
                          {user?.role === 'teacher' && (
                            <CloseOutlined
                              style={{ color: '#999', fontSize: '12px', marginLeft: '8px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTopic(topic);
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 右侧：聊天区域 */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* 顶部标题 */}
                    <div style={{ padding: '16px', borderBottom: '1px solid #d9d9d9', display: 'flex', alignItems: 'center' }}>
                      <Title level={5} style={{ margin: 0 }}>
                        {!selectedTopic ? '请选择话题' : selectedTopic}
                      </Title>
                    </div>

                    {/* 聊天记录 */}
                    <div 
                      className="chat-container"
                      style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: '#f5f5f5' }}
                    >
                      {!selectedTopic ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                          请从左侧选择话题开始互动
                        </div>
                      ) : (
                        [...interactions].filter(item => 
                          item.topic === selectedTopic
                        ).map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            marginBottom: '16px',
                            justifyContent: item.senderRole === user?.role ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div
                            style={{
                              maxWidth: '60%',
                              display: 'flex',
                              flexDirection: item.senderRole === user?.role ? 'row-reverse' : 'row'
                            }}
                          >
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: item.senderRole === 'teacher' ? '#1890ff' : '#52c41a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                margin: item.senderRole === user?.role ? '0 0 0 12px' : '0 12px 0 0',
                                flexShrink: 0
                              }}
                            >
                              {item.senderName.charAt(0)}
                            </div>
                            <div>
                              <div
                                style={{
                                  marginBottom: '4px',
                                  color: '#999',
                                  fontSize: '12px',
                                  textAlign: item.senderRole === user?.role ? 'right' : 'left'
                                }}
                              >
                                {item.senderName} · {dayjs(item.createdAt).format('HH:mm')}
                                {item.topic && <Tag color="orange" style={{ marginLeft: '8px' }}>{item.topic}</Tag>}
                              </div>
                              <div
                                style={{
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  backgroundColor: item.senderRole === user?.role ? '#95ec69' : 'white',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {item.content}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                      )}
                    </div>

                    {/* 聊天输入框 */}
                    <div style={{ padding: '16px', borderTop: '1px solid #d9d9d9', backgroundColor: '#fff' }}>
                      <TextArea
                        rows={3}
                        placeholder={!selectedTopic ? '请先选择话题' : '输入发言内容...'}
                        value={messageContent}
                        onChange={(event) => setMessageContent(event.target.value)}
                        onPressEnter={(e) => {
                          if ((e.ctrlKey || e.metaKey) && selectedTopic) {
                            void handleSendMessage();
                          }
                        }}
                        style={{ marginBottom: '12px' }}
                        disabled={!selectedTopic}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title={!selectedTopic ? '请选择话题后再发言' : ''}>
                          <Button
                            type="primary"
                            onClick={() => void handleSendMessage()}
                            disabled={!messageContent.trim() || !selectedTopic}
                          >
                            发送 (Ctrl+Enter)
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </TabPane>
              {user?.role === 'teacher' && (
                <TabPane tab="课堂随机选人" key="randompick">
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Space>
                      <InputNumber
                        min={1}
                        max={10}
                        value={pickCount}
                        onChange={(value) => setPickCount(value ?? 1)}
                        addonAfter="人"
                      />
                      <Button type="primary" onClick={() => void handleRandomPick()} disabled={isPicking}>
                        随机抽取
                      </Button>
                    </Space>

                    {isPicking && (
                      <Card style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Text type="secondary" style={{ fontSize: '16px', marginBottom: '20px', display: 'block' }}>正在随机抽取中...</Text>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff', transition: 'all 0.1s ease' }}>
                          {currentPicked.map((student, index) => (
                            <span key={index} style={{ margin: '0 10px' }}>{student}</span>
                          ))}
                        </div>
                      </Card>
                    )}

                    {!isPicking && animationResult && (
                      <Card style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Text type="secondary" style={{ fontSize: '16px', marginBottom: '20px', display: 'block' }}>随机抽取结果</Text>
                        <Text style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}>
                          {animationResult}
                        </Text>
                      </Card>
                    )}

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
                </TabPane>
              )}
            </Tabs>
          </Card>
        </>
      )}
    </div>
  );
};

export default Classroom;
