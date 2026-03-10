import { Avatar, Button, Card, Descriptions, Result, Space, Tag, Typography } from 'antd';
import { ArrowLeftOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import type { ManagedRole } from '@/types';
import { getPersonnelById } from '@/services/personnel';
import { getPersonnelMeta, isStudentRecord, isTeacherRecord, statusColorMap, statusTextMap } from './shared';
import './PersonnelManagement.css';

const { Paragraph, Text, Title } = Typography;

interface PersonnelDetailProps {
  role: ManagedRole;
}

const PersonnelDetail = ({ role }: PersonnelDetailProps) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAppSelector((state) => state.auth);

  const meta = getPersonnelMeta(role);
  const currentRecord = id ? getPersonnelById(role, id) : undefined;

  if (user?.role !== 'admin') {
    return <Result status="403" title="仅教务处可访问人员管理" />;
  }

  if (!id || !currentRecord) {
    return <Result status="404" title={`${meta.roleLabel}不存在`} />;
  }

  return (
    <div className="personnel-page">
      <div className="personnel-page-header">
        <div>
          <Title level={3}>{meta.detailLabel}</Title>
          <Paragraph type="secondary">详情页面独立展示，不使用弹窗。</Paragraph>
        </div>

        <div className="personnel-page-actions">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(meta.listPath)}>
            返回列表
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`${meta.listPath}/${id}/edit`)}>
            编辑
          </Button>
        </div>
      </div>

      <Card>
        <div className="personnel-detail-hero">
          <Avatar size={72} src={currentRecord.avatar || undefined} icon={!currentRecord.avatar && <UserOutlined />}>
            {!currentRecord.avatar ? currentRecord.real_name.slice(0, 1) : null}
          </Avatar>
          <div className="personnel-detail-meta">
            <Text strong>{currentRecord.real_name}</Text>
            <Text type="secondary">账号：{currentRecord.username}</Text>
            <Space>
              <Tag color={statusColorMap[currentRecord.status]}>{statusTextMap[currentRecord.status]}</Tag>
              <Tag>{meta.roleLabel}</Tag>
            </Space>
          </div>
        </div>
      </Card>

      <Card>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="账号">{currentRecord.username}</Descriptions.Item>
          <Descriptions.Item label="姓名">{currentRecord.real_name}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{currentRecord.email}</Descriptions.Item>
          <Descriptions.Item label={role === 'student' ? '手机号/监护人手机号' : '手机号'}>{currentRecord.phone}</Descriptions.Item>
          <Descriptions.Item label="状态">{statusTextMap[currentRecord.status]}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{currentRecord.created_at}</Descriptions.Item>

          {isStudentRecord(currentRecord) ? (
            <>
              <Descriptions.Item label="学号">{currentRecord.student_no}</Descriptions.Item>
              <Descriptions.Item label="年级">{currentRecord.grade}</Descriptions.Item>
              <Descriptions.Item label="班级">{currentRecord.class_name}</Descriptions.Item>
              <Descriptions.Item label="监护人姓名">{currentRecord.guardian}</Descriptions.Item>
            </>
          ) : null}

          {isTeacherRecord(currentRecord) ? (
            <>
              <Descriptions.Item label="教工号">{currentRecord.teacher_no}</Descriptions.Item>
              <Descriptions.Item label="所属学部">{currentRecord.department}</Descriptions.Item>
              <Descriptions.Item label="任教学科" span={2}>
                <div className="personnel-subject-tags">
                  {currentRecord.subjects_json.map((subject) => (
                    <Tag color="blue" key={`${currentRecord.id}-${subject}`}>
                      {subject}
                    </Tag>
                  ))}
                </div>
              </Descriptions.Item>
            </>
          ) : null}
        </Descriptions>
      </Card>
    </div>
  );
};

export default PersonnelDetail;
