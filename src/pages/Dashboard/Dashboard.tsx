import { Card, List, Tag, Typography } from 'antd';
import { useAppSelector } from '@/store/hooks';
import './Dashboard.css';

const { Title, Paragraph, Text } = Typography;

const Dashboard = () => {
  const { user } = useAppSelector((state) => state.auth);

  const todoList =
    user?.role === 'teacher'
      ? ['创建课程并上传章节资料', '拉取学生加入课程', '发起课堂签到与互动', '发布测验并批改结果']
      : user?.role === 'admin'
        ? ['制定年级/班级课程表并执行自动排课', '同步考勤机数据并标注异常', '输出多维统计并导出报表', '维护学生档案与信息权限']
        : ['加入公开课程', '完成课堂签到', '参与课堂互动发言', '完成测试并查看分析'];

  const roleColor = user?.role === 'teacher' ? 'blue' : user?.role === 'student' ? 'green' : 'gold';
  const roleLabel = user?.role === 'teacher' ? '教师' : user?.role === 'student' ? '学生' : '教务处';

  const getWelcomeText = () => {
    if (!user) return '欢迎使用教学管理系统';
    if (user.role === 'teacher') return '欢迎来到教师首页';
    if (user.role === 'student') return '欢迎来到学习中心';
    return '欢迎来到教务处管理后台';
  };

  const getDescriptionText = () => {
    if (!user) return '';
    if (user.role === 'teacher') return '管理您的课程、学生和教学活动，轻松开展教学工作';
    if (user.role === 'student') return '浏览课程、参与互动、完成测试，享受便捷的学习体验';
    return '全面管理教学事务，提高教务工作效率';
  };

  const getFeatures = () => {
    if (!user) return [];
    if (user.role === 'teacher') {
      return [
        { title: '课程管理', desc: '创建和管理课程，上传教学资料' },
        { title: '学生管理', desc: '查看和管理班级学生信息' },
        { title: '课堂互动', desc: '发起签到、话题讨论和随机点名' },
        { title: '测试系统', desc: '创建测验、批改作业和查看统计' },
      ];
    }
    if (user.role === 'student') {
      return [
        { title: '课程学习', desc: '浏览课程内容，获取学习资料' },
        { title: '课堂参与', desc: '完成签到，参与话题互动' },
        { title: '在线测试', desc: '参加测验，查看成绩和分析' },
        { title: '个人中心', desc: '查看学习进度和个人信息' },
      ];
    }
    return [
      { title: '课程安排', desc: '管理课程表和自动排课' },
      { title: '学生档案', desc: '维护学生信息和权限管理' },
      { title: '考勤统计', desc: '查看和分析考勤数据' },
      { title: '学情分析', desc: '多维度统计和报表导出' },
    ];
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <Title level={2}>{getWelcomeText()}</Title>
        <Paragraph type="secondary" style={{ fontSize: '16px', marginTop: '8px' }}>
          {getDescriptionText()}
        </Paragraph>
        {user && (
          <div style={{ marginTop: '16px' }}>
            <Tag color={roleColor} style={{ fontSize: '14px', padding: '4px 12px' }}>
              当前身份：{roleLabel}
            </Tag>
            {user.realName && (
              <Text strong style={{ marginLeft: '12px', fontSize: '16px' }}>
                {user.realName}
              </Text>
            )}
          </div>
        )}
      </div>

      <div className="dashboard-features">
        <Title level={4} style={{ marginBottom: '20px' }}>功能概览</Title>
        <div className="feature-grid">
          {getFeatures().map((feature, index) => (
            <Card key={index} className="feature-card" hoverable>
              <Title level={5} style={{ marginBottom: '8px' }}>{feature.title}</Title>
              <Text type="secondary">{feature.desc}</Text>
            </Card>
          ))}
        </div>
      </div>

      <Card className="dashboard-card" title="建议操作" style={{ marginTop: '24px' }}>
        <List
          dataSource={todoList}
          renderItem={(item, index) => (
            <List.Item>
              <span className="dashboard-step">{index + 1}.</span>
              <span>{item}</span>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
