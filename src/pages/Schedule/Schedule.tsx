import { useMemo, useState } from 'react';
import { Button, Card, Empty, Form, Input, Modal, Select, Space, TimePicker, Typography, message } from 'antd';
import { ExportOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/store/hooks';
import dayjs from 'dayjs';
import './Schedule.css';

const { Title, Text } = Typography;

type DayValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface PeriodSlot {
  index: number;
  start: string;
  end: string;
}

interface TimetableEntry {
  id: string;
  grade: string;
  className: string;
  day: DayValue;
  period: number;
  subject: string;
  teacher: string;
  classroom: string;
}

interface ScheduleFormValues {
  subject: string;
  teacher: string;
  classroom: string;
}

interface PeriodFormValues {
  index: number;
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
}

const days: Array<{ label: string; value: DayValue }> = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
];

const initialPeriods: PeriodSlot[] = [
  { index: 1, start: '08:00', end: '08:45' },
  { index: 2, start: '08:55', end: '09:40' },
  { index: 3, start: '10:00', end: '10:45' },
  { index: 4, start: '10:55', end: '11:40' },
  { index: 5, start: '14:00', end: '14:45' },
  { index: 6, start: '14:55', end: '15:40' },
  { index: 7, start: '16:00', end: '16:45' },
  { index: 8, start: '16:55', end: '17:40' },
];

const gradeOptions = ['初一', '初二', '初三', '高一', '高二', '高三'];
const classOptions = ['1班', '2班', '3班', '4班'];
const subjectOptions = ['语文', '数学', '英语', '物理', '化学', '多媒体', '日语'];
const teacher = [
  {teacher: '李老师',subject: '语文'},{teacher: '张老师',subject: '数学'},{teacher: '王老师',subject: '英语'},
  {teacher: '王老师',subject: '日语'},{teacher: '周老师',subject: '物理'},{teacher: '陈老师',subject: '多媒体'},
  {teacher: '孙老师',subject: '语文'},{teacher: '韩老师',subject: '数学'},{teacher: '刘老师',subject: '化学'},
  {teacher: '朱老师',subject: '日语'},{teacher: '赵老师',subject: '物理'},{teacher: '吴老师',subject: '英语'},
  {teacher: '吕老师',subject: '语文'},{teacher: '蒋老师',subject: '数学'},{teacher: '郑老师',subject: '多媒体'},
  {teacher: '褚老师',subject: '化学'},{teacher: '沈老师',subject: '物理'},{teacher: '孔老师',subject: '英语'},
  {teacher: '施老师',subject: '日语'},{teacher: '严老师',subject: '数学'},{teacher: '曹老师',subject: '多媒体'}
]
const classroom = ['A101','A102','A103','A105',
  'A201','A202','A203','A205',
  'B101','B102','B103','B105',
  'B201','B202','B203','B205',
  'C101','C102','C103','C105',
  'C201','C202','C203','C205',
]

const initialEntries: TimetableEntry[] = [
  { id: 'g1c1-1-1', grade: '初一', className: '1班', day: 1, period: 1, subject: '语文', teacher: '李老师', classroom: 'A101' },
  { id: 'g1c1-1-2', grade: '初一', className: '1班', day: 1, period: 2, subject: '数学', teacher: '张老师', classroom: 'A101' },
  { id: 'g1c1-1-3', grade: '初一', className: '1班', day: 1, period: 3, subject: '英语', teacher: '王老师', classroom: 'A101' },
  { id: 'g1c1-1-4', grade: '初一', className: '1班', day: 1, period: 4, subject: '多媒体', teacher: '周老师', classroom: 'A101' },
  { id: 'g1c1-1-5', grade: '初一', className: '1班', day: 1, period: 5, subject: '物理', teacher: '陈老师', classroom: 'A201' },
  { id: 'g1c1-1-6', grade: '初一', className: '1班', day: 1, period: 6, subject: '日语', teacher: '孙老师', classroom: 'A101' },
  { id: 'g1c1-1-7', grade: '初一', className: '1班', day: 1, period: 7, subject: '语文', teacher: '李老师', classroom: 'A101' },
  { id: 'g1c1-2-1', grade: '初一', className: '1班', day: 2, period: 1, subject: '数学', teacher: '张老师', classroom: 'A101' },
  { id: 'g1c1-2-2', grade: '初一', className: '1班', day: 2, period: 2, subject: '语文', teacher: '李老师', classroom: 'A101' },
  { id: 'g1c1-2-3', grade: '初一', className: '1班', day: 2, period: 3, subject: '多媒体', teacher: '吴老师', classroom: 'A203' },
  { id: 'g1c1-2-4', grade: '初一', className: '1班', day: 2, period: 4, subject: '英语', teacher: '王老师', classroom: 'A101' },
  { id: 'g1c1-2-5', grade: '初一', className: '1班', day: 2, period: 5, subject: '化学', teacher: '郑老师', classroom: '实验楼1' },
  { id: 'g1c1-2-6', grade: '初一', className: '1班', day: 2, period: 6, subject: '日语', teacher: '何老师', classroom: 'A102' },
  { id: 'g1c1-2-7', grade: '初一', className: '1班', day: 2, period: 7, subject: '多媒体', teacher: '刘老师', classroom: '机房1' },
  { id: 'g1c1-3-1', grade: '初一', className: '1班', day: 3, period: 1, subject: '英语', teacher: '王老师', classroom: 'A101' },
  { id: 'g1c1-3-2', grade: '初一', className: '1班', day: 3, period: 2, subject: '语文', teacher: '李老师', classroom: 'A101' },
  { id: 'g1c1-3-3', grade: '初一', className: '1班', day: 3, period: 3, subject: '数学', teacher: '张老师', classroom: 'A101' },
  { id: 'g1c1-3-5', grade: '初一', className: '1班', day: 3, period: 5, subject: '物理', teacher: '陈老师', classroom: 'A201' },
  { id: 'g1c1-4-1', grade: '初一', className: '1班', day: 4, period: 1, subject: '语文', teacher: '李老师', classroom: 'A101' },
  { id: 'g1c1-4-2', grade: '初一', className: '1班', day: 4, period: 2, subject: '数学', teacher: '张老师', classroom: 'A101' },
  { id: 'g1c1-4-3', grade: '初一', className: '1班', day: 4, period: 3, subject: '英语', teacher: '王老师', classroom: 'A101' },
  { id: 'g1c1-4-6', grade: '初一', className: '1班', day: 4, period: 6, subject: '日语', teacher: '孙老师', classroom: 'A102' },
  { id: 'g1c1-5-1', grade: '初一', className: '1班', day: 5, period: 1, subject: '语文', teacher: '李老师', classroom: 'A101' },
  { id: 'g1c1-5-2', grade: '初一', className: '1班', day: 5, period: 2, subject: '数学', teacher: '张老师', classroom: 'A101' },
  { id: 'g1c1-5-3', grade: '初一', className: '1班', day: 5, period: 3, subject: '英语', teacher: '王老师', classroom: 'A101' },
  { id: 'g1c1-5-4', grade: '初一', className: '1班', day: 5, period: 4, subject: '多媒体', teacher: '周老师', classroom: '机房2' },
];

const pickRandom = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

const generateAutoScheduleData = (
  grade: string,
  className: string,
  periods: PeriodSlot[]
): TimetableEntry[] => {
  const batchId = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  let index = 0;

  return days
    .filter((day) => day.value <= 5)
    .flatMap((day) =>
    periods.map((period) => {
      const subject = pickRandom(subjectOptions);
      const teachersBySubject = teacher.filter((item) => item.subject === subject);
      const teacherName = (teachersBySubject.length > 0 ? pickRandom(teachersBySubject) : pickRandom(teacher)).teacher;

      index += 1;
      return {
        id: `auto-${batchId}-${index}`,
        grade,
        className,
        day: day.value,
        period: period.index,
        subject,
        teacher: teacherName,
        classroom: pickRandom(classroom),
      };
    })
    );
};

const makeCellKey = (day: DayValue, period: number) => `${day}-${period}`;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildScheduleExcelXml = (params: {
  title: string;
  exportTime: string;
  exportDays: Array<{ label: string; value: DayValue }>;
  periods: PeriodSlot[];
  map: Map<string, TimetableEntry>;
}) => {
  const { title, exportTime, exportDays, periods, map } = params;
  const expandedColumnCount = exportDays.length + 1;
  const expandedRowCount = periods.length + 3;

  const columnXml = [
    '<Column ss:Width="130"/>',
    ...exportDays.map(() => '<Column ss:Width="120"/>'),
  ].join('');

  const headerXml = [
    '<Cell ss:StyleID="header"><Data ss:Type="String">节次 / 时间</Data></Cell>',
    ...exportDays.map(
      (day) => `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(day.label)}</Data></Cell>`
    ),
  ].join('');

  const rowsXml = periods
    .map((period) => {
      const firstColText = `第${period.index}节 ${period.start}-${period.end}`;
      const courseCols = exportDays.map((day) => {
        const entry = map.get(makeCellKey(day.value, period.index));
        const courseText = entry ? `${entry.subject}\n${entry.teacher}\n${entry.classroom}` : '';
        const xmlSafeText = escapeXml(courseText).replace(/\n/g, '&#10;');
        return `<Cell ss:StyleID="course"><Data ss:Type="String">${xmlSafeText}</Data></Cell>`;
      });

      return `<Row>
        <Cell ss:StyleID="time"><Data ss:Type="String">${escapeXml(firstColText)}</Data></Cell>
        ${courseCols.join('')}
      </Row>`;
    })
    .join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center" ss:Horizontal="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
      <Font ss:FontName="Microsoft YaHei" ss:Size="10"/>
    </Style>
    <Style ss:ID="title">
      <Font ss:FontName="Microsoft YaHei" ss:Size="15" ss:Bold="1" ss:Color="#1F2D3D"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#DCE6F1" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="meta">
      <Font ss:FontName="Microsoft YaHei" ss:Size="10" ss:Color="#6B7280"/>
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="header">
      <Font ss:FontName="Microsoft YaHei" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#4F81BD" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="time">
      <Font ss:FontName="Microsoft YaHei" ss:Size="10" ss:Bold="1" ss:Color="#1F2937"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#EAF2FF" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="course">
      <Font ss:FontName="Microsoft YaHei" ss:Size="10" ss:Color="#111827"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(title.slice(0, 31))}">
    <Table ss:ExpandedColumnCount="${expandedColumnCount}" ss:ExpandedRowCount="${expandedRowCount}" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="46">
      ${columnXml}
      <Row ss:Height="30">
        <Cell ss:MergeAcross="${exportDays.length}" ss:StyleID="title">
          <Data ss:Type="String">${escapeXml(title)}</Data>
        </Cell>
      </Row>
      <Row ss:Height="24">
        <Cell ss:MergeAcross="${exportDays.length}" ss:StyleID="meta">
          <Data ss:Type="String">${escapeXml(`导出时间：${exportTime}`)}</Data>
        </Cell>
      </Row>
      <Row ss:Height="26">
        ${headerXml}
      </Row>
      ${rowsXml}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <Selected/>
      <FreezePanes/>
      <FrozenNoSplit/>
      <SplitHorizontal>3</SplitHorizontal>
      <TopRowBottomPane>3</TopRowBottomPane>
    </WorksheetOptions>
  </Worksheet>
</Workbook>`;
};

const Schedule = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [messageApi, contextHolder] = message.useMessage();
  const [entries, setEntries] = useState<TimetableEntry[]>(initialEntries);
  const [periods, setPeriods] = useState<PeriodSlot[]>(initialPeriods);
  const [selectedGrade, setSelectedGrade] = useState<string>('初一');
  const [selectedClass, setSelectedClass] = useState<string>('1班');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [editingCell, setEditingCell] = useState<{ day: DayValue; period: number } | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<PeriodSlot | null>(null);
  const [form] = Form.useForm<ScheduleFormValues>();
  const [periodForm] = Form.useForm<PeriodFormValues>();

  const scopedEntries = useMemo(
    () => entries.filter((item) => item.grade === selectedGrade && item.className === selectedClass),
    [entries, selectedClass, selectedGrade]
  );

  const displayEntries = useMemo(
    () =>
      selectedSubject === 'all'
        ? scopedEntries
        : scopedEntries.filter((item) => item.subject === selectedSubject),
    [scopedEntries, selectedSubject]
  );

  const scopedMap = useMemo(() => {
    const map = new Map<string, TimetableEntry>();
    scopedEntries.forEach((item) => {
      map.set(makeCellKey(item.day, item.period), item);
    });
    return map;
  }, [scopedEntries]);

  const displayMap = useMemo(() => {
    const map = new Map<string, TimetableEntry>();
    displayEntries.forEach((item) => {
      map.set(makeCellKey(item.day, item.period), item);
    });
    return map;
  }, [displayEntries]);

  const editingEntry = useMemo(() => {
    if (!editingCell) {
      return null;
    }
    return scopedMap.get(makeCellKey(editingCell.day, editingCell.period)) ?? null;
  }, [editingCell, scopedMap]);

  const openScheduleModal = (day: DayValue, period: number) => {
    const existing = scopedMap.get(makeCellKey(day, period));
    setEditingCell({ day, period });
    form.setFieldsValue({
      subject: existing?.subject,
      teacher: existing?.teacher,
      classroom: existing?.classroom,
    });
  };

  const closeScheduleModal = () => {
    setEditingCell(null);
    form.resetFields();
  };

  const handleSaveSchedule = async () => {
    if (!editingCell) {
      return;
    }

    const values = await form.validateFields();
    const newEntry: TimetableEntry = {
      id: editingEntry?.id ?? `schedule-${Date.now()}`,
      grade: selectedGrade,
      className: selectedClass,
      day: editingCell.day,
      period: editingCell.period,
      subject: values.subject,
      teacher: values.teacher,
      classroom: values.classroom,
    };

    setEntries((prev) => {
      const next = prev.filter(
        (item) =>
          !(
            item.grade === selectedGrade &&
            item.className === selectedClass &&
            item.day === editingCell.day &&
            item.period === editingCell.period
          )
      );
      next.push(newEntry);
      return next;
    });

    messageApi.success(editingEntry ? '课程已更新' : '排课成功');
    closeScheduleModal();
  };

  const handleDeleteSchedule = () => {
    if (!editingCell || !editingEntry) {
      return;
    }

    setEntries((prev) =>
      prev.filter(
        (item) =>
          !(
            item.grade === selectedGrade &&
            item.className === selectedClass &&
            item.day === editingCell.day &&
            item.period === editingCell.period
          )
      )
    );
    messageApi.success('课程已删除');
    closeScheduleModal();
  };

  const handleExportExcel = () => {
    const exportDays = days.filter((day) => day.value <= 5);
    const exportTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const suffix = selectedSubject === 'all' ? '' : `（${selectedSubject}）`;
    const title = `${selectedGrade}${selectedClass}课程表${suffix}`;
    const xml = buildScheduleExcelXml({
      title,
      exportTime,
      exportDays,
      periods,
      map: displayMap,
    });

    const fileName = `${title}-${dayjs().format('YYYYMMDD-HHmmss')}.xls`;
    const blob = new Blob([`\ufeff${xml}`], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    messageApi.success(`已导出 ${title}（Excel）`);
  };

  const handleAutoSchedule = () => {
    const autoScheduleData = generateAutoScheduleData(selectedGrade, selectedClass, periods);

    setEntries((prev) => {
      const otherEntries = prev.filter(
        (item) => !(item.grade === selectedGrade && item.className === selectedClass)
      );
      return [...otherEntries, ...autoScheduleData];
    });

    messageApi.success(`已为 ${selectedGrade}${selectedClass} 自动排课完成`);
  };

  const openPeriodModal = (period: PeriodSlot) => {
    setEditingPeriod(period);
    // 将时间字符串转换为dayjs对象
    const [startHour, startMinute] = period.start.split(':').map(Number);
    const [endHour, endMinute] = period.end.split(':').map(Number);
    const today = dayjs();
    const startDate = today.hour(startHour).minute(startMinute).second(0);
    const endDate = today.hour(endHour).minute(endMinute).second(0);
    periodForm.setFieldsValue({
      ...period,
      start: startDate,
      end: endDate
    });
  };

  const closePeriodModal = () => {
    setEditingPeriod(null);
    periodForm.resetFields();
  };

  const handleSavePeriod = async () => {
    if (!editingPeriod) {
      return;
    }

    const values = await periodForm.validateFields();
    // 将dayjs对象转换为时间字符串
    const formatTime = (date: dayjs.Dayjs) => {
      return date.format('HH:mm');
    };
    const updatedPeriod: PeriodSlot = {
      index: editingPeriod.index,
      start: formatTime(values.start),
      end: formatTime(values.end)
    };
    setPeriods((prev) =>
      prev.map((item) => (item.index === editingPeriod.index ? updatedPeriod : item))
    );

    messageApi.success('时间段已更新');
    closePeriodModal();
  };

  if (user?.role !== 'admin') {
    return <Empty description="仅教务处可查看课程表管理系统" />;
  }

  return (
    <div className="schedule-page">
      {contextHolder}
      <div className="schedule-header">
        <div>
          <Title level={3} className="schedule-title">
            课程表管理系统
          </Title>
          <Text type="secondary">
            网格课程表支持鼠标悬停快速排课。默认显示：初一 1班，所有学科。
          </Text>
        </div>
        <Space wrap>
          <Select
            value={selectedGrade}
            onChange={setSelectedGrade}
            options={gradeOptions.map((item) => ({ label: item, value: item }))}
            style={{ width: 110 }}
          />
          <Select
            value={selectedClass}
            onChange={setSelectedClass}
            options={classOptions.map((item) => ({ label: item, value: item }))}
            style={{ width: 100 }}
          />
          <Select
            value={selectedSubject}
            onChange={setSelectedSubject}
            options={[
              { label: '所有学科', value: 'all' },
              ...subjectOptions.map((item) => ({ label: item, value: item })),
            ]}
            style={{ width: 130 }}
          />
          <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleAutoSchedule}>
            自动排课
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExportExcel}>
            导出 Excel
          </Button>
        </Space>
      </div>

      <Card className="schedule-grid-card">
        <div className="schedule-grid-scroll">
          <table className="schedule-grid-table">
            <thead>
              <tr>
                <th className="period-head">节次 / 时间</th>
                {days.map((day) => (
                  <th key={day.value}>{day.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period.index}>
                  <td className="period-cell">
                    <div className="period-index">{period.index}</div>
                    <div className="period-time" onClick={() => openPeriodModal(period)}>
                      {period.start} - {period.end}
                    </div>
                  </td>

                  {days.map((day) => {
                    const key = makeCellKey(day.value, period.index);
                    const displayEntry = displayMap.get(key);
                    const hasHiddenEntry = !displayEntry && scopedMap.has(key);

                    return (
                      <td key={key}>
                        <button
                          type="button"
                          className={`schedule-cell-button ${displayEntry ? 'is-filled' : 'is-empty'}`}
                          onClick={() => openScheduleModal(day.value, period.index)}
                          title={`排课：${selectedGrade}${selectedClass} ${day.label} 第${period.index}节`}
                        >
                          {displayEntry ? (
                            <div className="schedule-course">
                              <div className="schedule-subject">{displayEntry.subject}</div>
                              <div className="schedule-meta">{displayEntry.teacher}</div>
                              <div className="schedule-meta">{displayEntry.classroom}</div>
                            </div>
                          ) : (
                            <div className="schedule-empty">
                              {hasHiddenEntry ? <span className="schedule-filter-tip">已按学科筛选</span> : null}
                              <span className="schedule-cell-plus">+</span>
                            </div>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        title={editingEntry ? '编辑排课' : '新增排课'}
        open={Boolean(editingCell)}
        onCancel={closeScheduleModal}
        onOk={() => void handleSaveSchedule()}
        okText="保存"
        cancelText="取消"
        footer={(_, { OkBtn, CancelBtn }) => (
          <Space>
            {editingEntry ? (
              <Button danger onClick={handleDeleteSchedule}>
                删除该节课程
              </Button>
            ) : null}
            <CancelBtn />
            <OkBtn />
          </Space>
        )}
      >
        {editingCell ? (
          <div className="schedule-modal-meta">
            <Text type="secondary">
              {selectedGrade} {selectedClass} / {days.find((item) => item.value === editingCell.day)?.label} / 第
              {editingCell.period}节（{periods.find((item) => item.index === editingCell.period)?.start}-
              {periods.find((item) => item.index === editingCell.period)?.end}）
            </Text>
          </div>
        ) : null}

        <Form form={form} layout="vertical">
          <Form.Item name="subject" label="学科" rules={[{ required: true, message: '请选择学科' }]}>
            <Select options={subjectOptions.map((item) => ({ label: item, value: item }))} />
          </Form.Item>
          <Form.Item name="teacher" label="任课教师" rules={[{ required: true, message: '请输入任课教师' }]}>
            <Input placeholder="例如：李老师" />
          </Form.Item>
          <Form.Item name="classroom" label="教室" rules={[{ required: true, message: '请输入教室' }]}>
            <Input placeholder="例如：A101" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑时间段"
        open={Boolean(editingPeriod)}
        onCancel={closePeriodModal}
        onOk={() => void handleSavePeriod()}
        okText="保存"
        cancelText="取消"
      >
        {editingPeriod ? (
          <div className="schedule-modal-meta">
            <Text type="secondary">
              第{editingPeriod.index}节
            </Text>
          </div>
        ) : null}

        <Form form={periodForm} layout="vertical">
          <Form.Item name="index" label="节次" rules={[{ required: true, message: '请输入节次' }]}>
            <Input type="number" min={1} disabled />
          </Form.Item>
          <Form.Item name="start" label="开始时间" rules={[{ required: true, message: '请选择开始时间' }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end" label="结束时间" rules={[{ required: true, message: '请选择结束时间' }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Schedule;
