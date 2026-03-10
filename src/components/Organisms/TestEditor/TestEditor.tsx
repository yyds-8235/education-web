import React, { useState, useCallback } from 'react';
import { Form, Input, Select, InputNumber, Button, Space, Card, Divider, Modal, message } from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    DragOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import type { TestQuestion, QuestionType, QuestionOption } from '@/types';
import './TestEditor.css';

const { TextArea } = Input;

export interface TestEditorProps {
    questions?: TestQuestion[];
    onChange?: (questions: TestQuestion[]) => void;
    onSubmit?: (questions: TestQuestion[]) => void;
    loading?: boolean;
    className?: string;
}

interface QuestionFormData {
    type: QuestionType;
    content: string;
    options?: { label: string; content: string }[];
    answer: string;
    score: number;
    analysis?: string;
}

const defaultQuestion: QuestionFormData = {
    type: 'single_choice',
    content: '',
    options: [
        { label: 'A', content: '' },
        { label: 'B', content: '' },
        { label: 'C', content: '' },
        { label: 'D', content: '' },
    ],
    answer: '',
    score: 10,
    analysis: '',
};

const TestEditor: React.FC<TestEditorProps> = ({
    questions = [],
    onChange,
    onSubmit,
    loading = false,
    className = '',
}) => {
    const [messageApi, contextHolder] = message.useMessage();
    const [questionList, setQuestionList] = useState<TestQuestion[]>(questions);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState<QuestionFormData>(defaultQuestion);
    const [modalVisible, setModalVisible] = useState(false);

    const updateQuestionList = useCallback(
        (newList: TestQuestion[]) => {
            setQuestionList(newList);
            onChange?.(newList);
        },
        [onChange]
    );

    const handleAddQuestion = () => {
        setFormData(defaultQuestion);
        setEditingIndex(null);
        setModalVisible(true);
    };

    const handleEditQuestion = (index: number) => {
        const question = questionList[index];
        setFormData({
            type: question.type,
            content: question.content,
            options: question.options?.map((opt) => ({
                label: opt.label,
                content: opt.content,
            })),
            answer: question.answer,
            score: question.score,
            analysis: question.analysis,
        });
        setEditingIndex(index);
        setModalVisible(true);
    };

    const handleDeleteQuestion = (index: number) => {
        Modal.confirm({
            title: '确认删除',
            content: '确定要删除这道题目吗？',
            okText: '确定',
            cancelText: '取消',
            onOk: () => {
                const newList = questionList.filter((_, i) => i !== index);
                updateQuestionList(newList);
            },
        });
    };

    const handleSaveQuestion = () => {
        if (!formData.content.trim()) {
            messageApi.error('请输入题目内容');
            return;
        }

        if (formData.type === 'single_choice') {
            if (!formData.options?.every((opt) => opt.content.trim())) {
                messageApi.error('请填写所有选项');
                return;
            }
            if (!formData.answer) {
                messageApi.error('请选择正确答案');
                return;
            }
        } else if (!formData.answer.trim()) {
            messageApi.error('请输入答案');
            return;
        }

        const optionsWithId: QuestionOption[] | undefined = formData.options?.map((opt, idx) => ({
            id: `opt-${idx}`,
            label: opt.label,
            content: opt.content,
        }));

        const newQuestion: TestQuestion = {
            id: editingIndex !== null ? questionList[editingIndex].id : `q-${Date.now()}`,
            testId: '',
            type: formData.type,
            content: formData.content,
            options: optionsWithId,
            answer: formData.answer,
            score: formData.score,
            analysis: formData.analysis,
            order: editingIndex !== null ? questionList[editingIndex].order : questionList.length,
        };

        let newList: TestQuestion[];
        if (editingIndex !== null) {
            newList = [...questionList];
            newList[editingIndex] = newQuestion;
        } else {
            newList = [...questionList, newQuestion];
        }

        updateQuestionList(newList);
        setModalVisible(false);
        messageApi.success(editingIndex !== null ? '题目已更新' : '题目已添加');
    };

    const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= questionList.length) return;

        const newList = [...questionList];
        [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
        newList.forEach((q, i) => {
            q.order = i;
        });
        updateQuestionList(newList);
    };

    const getQuestionTypeLabel = (type: QuestionType) => {
        switch (type) {
            case 'single_choice':
                return '单选题';
            case 'fill_blank':
                return '填空题';
            case 'short_answer':
                return '简答题';
            default:
                return '';
        }
    };

    const totalScore = questionList.reduce((sum, q) => sum + q.score, 0);

    return (
        <div className={`test-editor ${className}`}>
            {contextHolder}
            <div className="test-editor-header">
                <div className="test-editor-stats">
                    <span>共 {questionList.length} 道题目</span>
                    <Divider type="vertical" />
                    <span>总分 {totalScore} 分</span>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddQuestion}>
                    添加题目
                </Button>
            </div>

            <div className="test-editor-content">
                {questionList.length === 0 ? (
                    <div className="test-editor-empty">
                        <p>暂无题目，点击上方按钮添加</p>
                    </div>
                ) : (
                    <div className="question-list">
                        {questionList.map((question, index) => (
                            <Card
                                key={question.id}
                                className="question-card"
                                title={
                                    <div className="question-card-header">
                                        <span className="question-number">第 {index + 1} 题</span>
                                        <span className="question-type">
                                            {getQuestionTypeLabel(question.type)}
                                        </span>
                                        <span className="question-score">{question.score} 分</span>
                                    </div>
                                }
                                extra={
                                    <Space>
                                        <Button
                                            type="text"
                                            icon={<DragOutlined />}
                                            onClick={() => handleMoveQuestion(index, 'up')}
                                            disabled={index === 0}
                                        />
                                        <Button
                                            type="text"
                                            icon={<DragOutlined />}
                                            onClick={() => handleMoveQuestion(index, 'down')}
                                            disabled={index === questionList.length - 1}
                                        />
                                        <Button type="text" onClick={() => handleEditQuestion(index)}>
                                            编辑
                                        </Button>
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleDeleteQuestion(index)}
                                        />
                                    </Space>
                                }
                            >
                                <div className="question-content">{question.content}</div>
                                {question.type === 'single_choice' && question.options && (
                                    <div className="question-options">
                                        {question.options.map((opt) => (
                                            <div
                                                key={opt.id || opt.label}
                                                className={`question-option ${question.answer === opt.label ? 'correct' : ''}`}
                                            >
                                                <span className="option-label">{opt.label}.</span>
                                                <span className="option-content">{opt.content}</span>
                                                {question.answer === opt.label && (
                                                    <CheckCircleOutlined className="correct-icon" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {question.type !== 'single_choice' && (
                                    <div className="question-answer">
                                        <span className="answer-label">答案：</span>
                                        <span>{question.answer}</span>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {onSubmit && questionList.length > 0 && (
                <div className="test-editor-footer">
                    <Button type="primary" size="large" onClick={() => onSubmit(questionList)} loading={loading}>
                        保存测试
                    </Button>
                </div>
            )}

            <Modal
                title={editingIndex !== null ? '编辑题目' : '添加题目'}
                open={modalVisible}
                onOk={handleSaveQuestion}
                onCancel={() => setModalVisible(false)}
                width={700}
                okText="保存"
                cancelText="取消"
                className="question-modal"
            >
                <Form layout="vertical" className="question-form">
                    <Form.Item label="题目类型" required>
                        <Select
                            value={formData.type}
                            onChange={(value) => {
                                setFormData({
                                    ...formData,
                                    type: value,
                                    options: value === 'single_choice' ? defaultQuestion.options : undefined,
                                    answer: '',
                                });
                            }}
                            options={[
                                { value: 'single_choice', label: '单选题' },
                                { value: 'fill_blank', label: '填空题' },
                                { value: 'short_answer', label: '简答题' },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item label="题目内容" required>
                        <TextArea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="请输入题目内容"
                            rows={3}
                        />
                    </Form.Item>

                    {formData.type === 'single_choice' && (
                        <>
                            <Form.Item label="选项" required>
                                <div className="options-editor">
                                    {formData.options?.map((opt, index) => (
                                        <div key={opt.label} className="option-row">
                                            <span className="option-label">{opt.label}.</span>
                                            <Input
                                                value={opt.content}
                                                onChange={(e) => {
                                                    const newOptions = [...(formData.options || [])];
                                                    newOptions[index].content = e.target.value;
                                                    setFormData({ ...formData, options: newOptions });
                                                }}
                                                placeholder={`选项 ${opt.label}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Form.Item>
                            <Form.Item label="正确答案" required>
                                <Select
                                    value={formData.answer}
                                    onChange={(value) => setFormData({ ...formData, answer: value })}
                                    placeholder="请选择正确答案"
                                    options={formData.options?.map((opt) => ({
                                        value: opt.label,
                                        label: `${opt.label}. ${opt.content || '未填写'}`,
                                    }))}
                                />
                            </Form.Item>
                        </>
                    )}

                    {formData.type === 'fill_blank' && (
                        <Form.Item label="答案" required>
                            <Input
                                value={formData.answer}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                placeholder="请输入答案"
                            />
                        </Form.Item>
                    )}

                    {formData.type === 'short_answer' && (
                        <Form.Item label="参考答案" required>
                            <TextArea
                                value={formData.answer}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                placeholder="请输入参考答案"
                                rows={4}
                            />
                        </Form.Item>
                    )}

                    <Form.Item label="分值" required>
                        <InputNumber
                            value={formData.score}
                            onChange={(value) => setFormData({ ...formData, score: value || 10 })}
                            min={1}
                            max={100}
                        />
                    </Form.Item>

                    <Form.Item label="解析">
                        <TextArea
                            value={formData.analysis}
                            onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
                            placeholder="请输入题目解析（可选）"
                            rows={3}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TestEditor;
