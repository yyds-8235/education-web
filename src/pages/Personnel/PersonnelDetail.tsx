import { useEffect, useState } from 'react';
import { Avatar, Button, Card, Descriptions, Result, Space, Spin, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import type { ManagedRole, ManagedUser } from '@/types';
import { getPersonnelById } from '@/services/personnel';
import { getPersonnelMeta, isTeacherRecord, statusColorMap, statusTextMap } from './shared';
import './PersonnelManagement.css';

const { Paragraph, Text, Title } = Typography;

interface PersonnelDetailProps {
  role: ManagedRole;
}

const PersonnelDetail = ({ role }: PersonnelDetailProps) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAppSelector((state) => state.auth);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ManagedUser | null>(null);

  const meta = getPersonnelMeta(role);

  useEffect(() => {
    if (!id) {
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const record = await getPersonnelById(role, id);
        setCurrentRecord(record);
      } catch (error) {
        const messageText = error instanceof Error ? error.message : `获取${meta.roleLabel}详情失败`;
        messageApi.error(messageText);
        setCurrentRecord(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchDetail();
  }, [id, meta.roleLabel, role]);

  if (user?.role !== 'admin') {
    return <Result status="403" title="仅教务处可访问人员管理" />;
  }

  if (!id) {
    return <Result status="404" title={`${meta.roleLabel}不存在`} />;
  }

  if (loading) {
    return (
      <div className="personnel-page">
        {contextHolder}
        <Card>
          <Spin />
        </Card>
      </div>
    );
  }

  if (!currentRecord) {
    return <Result status="404" title={`${meta.roleLabel}不存在`} />;
  }

  return (
    <div className="personnel-page">
      {contextHolder}

      <div className="personnel-page-header">
        <div>
          <Title level={3}>{meta.detailLabel}</Title>
          <Paragraph type="secondary">详情页使用真实接口拉取人员资料。</Paragraph>
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


          {isTeacherRecord(currentRecord) ? (
            <>
              <Descriptions.Item label="账号">{currentRecord.username}</Descriptions.Item>
              <Descriptions.Item label="教工号">{currentRecord.teacher_no}</Descriptions.Item>

              <Descriptions.Item label="姓名">{currentRecord.real_name}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{currentRecord.email}</Descriptions.Item>
              <Descriptions.Item label="手机号">
                {currentRecord.phone}
              </Descriptions.Item>
              <Descriptions.Item label="状态">{statusTextMap[currentRecord.status]}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentRecord.created_at || '-'}</Descriptions.Item>
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
