import { Card, Col, List, Row, Statistic, Tag, Typography } from 'antd';
import { BookOutlined, CheckCircleOutlined, ExperimentOutlined, TeamOutlined } from '@ant-design/icons';
import { useMemo } from 'react';
import { mockStudents } from '@/mock/users';
import { useAppSelector } from '@/store/hooks';
import './Dashboard.css';

const { Title, Paragraph } = Typography;

const Dashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { allCourses, courseStudentMap } = useAppSelector((state) => state.course);
  const { allTests } = useAppSelector((state) => state.test);

  const summary = useMemo(() => {
    if (!user) {
      return {
        courseCount: 0,
        studentCount: 0,
        activeCourseCount: 0,
        testCount: 0,
      };
    }

    if (user.role === 'teacher') {
      const teacherCourses = allCourses.filter((course) => course.teacherId === user.id);
      const studentCount = teacherCourses.reduce(
        (sum, course) => sum + (courseStudentMap[course.id]?.length ?? 0),
        0
      );

      return {
        courseCount: teacherCourses.length,
        studentCount,
        activeCourseCount: teacherCourses.filter((course) => course.status === 'active').length,
        testCount: allTests.filter((test) => teacherCourses.some((course) => course.id === test.courseId)).length,
      };
    }

    if (user.role === 'admin') {
      return {
        courseCount: allCourses.length,
        studentCount: mockStudents.length,
        activeCourseCount: allCourses.filter((course) => course.status === 'active').length,
        testCount: allTests.length,
      };
    }

    const joinedCourses = allCourses.filter((course) =>
      (courseStudentMap[course.id] ?? []).some((student) => student.studentId === user.id)
    );

    return {
      courseCount: joinedCourses.length,
      studentCount: 1,
      activeCourseCount: joinedCourses.filter((course) => course.status === 'active').length,
      testCount: allTests.filter((test) => joinedCourses.some((course) => course.id === test.courseId)).length,
    };
  }, [allCourses, allTests, courseStudentMap, user]);

  const todoList =
    user?.role === 'teacher'
      ? ['创建课程并上传章节资料', '拉取学生加入课程', '发起课堂签到与互动', '发布测验并批改结果']
      : user?.role === 'admin'
        ? ['制定年级/班级课程表并执行自动排课', '同步考勤机数据并标注异常', '输出多维统计并导出报表', '维护学生档案与信息权限']
        : ['加入公开课程', '完成课堂签到', '参与课堂互动发言', '完成测试并查看分析'];

  const roleColor = user?.role === 'teacher' ? 'blue' : user?.role === 'student' ? 'green' : 'gold';
  const roleLabel = user?.role === 'teacher' ? '教师' : user?.role === 'student' ? '学生' : '教务处';
  const studentMetricLabel =
    user?.role === 'teacher' ? '已覆盖学生' : user?.role === 'student' ? '我的课程' : '学生总数';

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <Title level={3}>工作台</Title>
        <Paragraph type="secondary">
          当前身份：<Tag color={roleColor}>{roleLabel}</Tag>
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="课程数量" value={summary.courseCount} prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={studentMetricLabel} value={summary.studentCount} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="活跃课程" value={summary.activeCourseCount} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="测试数量" value={summary.testCount} prefix={<ExperimentOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card className="dashboard-card" title="本端建议操作">
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
