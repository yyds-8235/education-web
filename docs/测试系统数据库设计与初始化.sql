-- 测试系统数据库设计与初始化 SQL
-- 适用建议：MySQL 8.x
-- 依赖表：users, courses

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS submission_answers;
DROP TABLE IF EXISTS test_question_options;
DROP TABLE IF EXISTS test_submissions;
DROP TABLE IF EXISTS test_questions;
DROP TABLE IF EXISTS tests;

CREATE TABLE tests (
  id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT '测试 ID',
  course_id VARCHAR(36) NOT NULL COMMENT '课程 ID',
  title VARCHAR(128) NOT NULL COMMENT '标题',
  description TEXT NULL COMMENT '描述',
  duration INT NOT NULL COMMENT '时长，分钟',
  total_score INT NOT NULL DEFAULT 0 COMMENT '总分',
  show_answer TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否展示答案',
  status ENUM('draft','published','ended') NOT NULL DEFAULT 'draft' COMMENT '测试状态',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  CONSTRAINT fk_tests_course FOREIGN KEY (course_id) REFERENCES courses(id),
  KEY idx_tests_course (course_id),
  KEY idx_tests_status (status),
  KEY idx_tests_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='测试主表';

CREATE TABLE test_questions (
  id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT '题目 ID',
  test_id VARCHAR(36) NOT NULL COMMENT '测试 ID',
  type ENUM('single_choice','fill_blank','short_answer') NOT NULL COMMENT '题型',
  content TEXT NOT NULL COMMENT '题干',
  answer TEXT NOT NULL COMMENT '标准答案',
  score INT NOT NULL COMMENT '分值',
  sort_order INT NOT NULL COMMENT '题目顺序',
  analysis TEXT NULL COMMENT '解析',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  CONSTRAINT fk_test_questions_test FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  KEY idx_test_questions_test (test_id),
  KEY idx_test_questions_order (test_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='测试题目表';

CREATE TABLE test_question_options (
  id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT '选项 ID',
  question_id VARCHAR(36) NOT NULL COMMENT '题目 ID',
  label VARCHAR(8) NOT NULL COMMENT '选项标签 A/B/C/D',
  content TEXT NOT NULL COMMENT '选项内容',
  sort_order INT NOT NULL COMMENT '排序',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  CONSTRAINT fk_test_question_options_question FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE,
  KEY idx_test_question_options_question (question_id),
  KEY idx_test_question_options_order (question_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='测试题目选项表';

CREATE TABLE test_submissions (
  id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT '提交 ID',
  test_id VARCHAR(36) NOT NULL COMMENT '测试 ID',
  student_id VARCHAR(36) NOT NULL COMMENT '学生 ID',
  student_no VARCHAR(32) NOT NULL COMMENT '学号',
  total_score DECIMAL(6,2) NULL COMMENT '总分',
  status ENUM('draft','submitted','graded') NOT NULL DEFAULT 'submitted' COMMENT '提交状态',
  submitted_at DATETIME NULL COMMENT '提交时间',
  graded_at DATETIME NULL COMMENT '批改时间',
  analysis_summary TEXT NULL COMMENT '分析摘要',
  appeal_reason TEXT NULL COMMENT '申诉原因',
  appeal_status ENUM('pending','accepted','rejected') NULL COMMENT '申诉状态',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  CONSTRAINT fk_test_submissions_test FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  CONSTRAINT fk_test_submissions_student FOREIGN KEY (student_id) REFERENCES users(id),
  UNIQUE KEY uk_test_student (test_id, student_id),
  KEY idx_test_submissions_test (test_id),
  KEY idx_test_submissions_student (student_id),
  KEY idx_test_submissions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='测试提交表';

CREATE TABLE submission_answers (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '自增 ID',
  submission_id VARCHAR(36) NOT NULL COMMENT '提交 ID',
  question_id VARCHAR(36) NOT NULL COMMENT '题目 ID',
  answer TEXT NOT NULL COMMENT '学生答案',
  score DECIMAL(6,2) NULL COMMENT '得分',
  feedback TEXT NULL COMMENT '教师反馈',
  is_correct TINYINT(1) NULL COMMENT '是否正确',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  CONSTRAINT fk_submission_answers_submission FOREIGN KEY (submission_id) REFERENCES test_submissions(id) ON DELETE CASCADE,
  CONSTRAINT fk_submission_answers_question FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE,
  UNIQUE KEY uk_submission_question (submission_id, question_id),
  KEY idx_submission_answers_submission (submission_id),
  KEY idx_submission_answers_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提交答案表';

INSERT INTO tests (id, course_id, title, description, duration, total_score, show_answer, status, created_at, updated_at) VALUES
('test-1', 'course-2', '一次函数与勾股定理小测', '覆盖函数代入计算、方程与定理应用。', 30, 100, 1, 'published', '2026-03-10 08:00:00', '2026-03-10 08:30:00'),
('test-2', 'course-6', '短视频剪辑基础测评', '用于评估镜头语言和剪辑流程基础。', 45, 100, 0, 'draft', '2026-03-10 09:00:00', '2026-03-10 09:00:00'),
('test-3', 'course-1', '语文阅读理解阶段测验', '覆盖古诗文理解与阅读表达。', 40, 100, 1, 'ended', '2026-03-09 14:00:00', '2026-03-10 11:00:00');

INSERT INTO test_questions (id, test_id, type, content, answer, score, sort_order, analysis, created_at, updated_at) VALUES
('question-1', 'test-1', 'single_choice', '一次函数 y = 2x + 1，当 x = 3 时，y 等于多少？', 'B', 20, 1, '代入 x = 3，得到 y = 7。', '2026-03-10 08:00:00', '2026-03-10 08:00:00'),
('question-2', 'test-1', 'fill_blank', '方程 2x = 10 的解是 x = ____。', '5', 20, 2, '两边同除以 2，得到 x = 5。', '2026-03-10 08:00:00', '2026-03-10 08:00:00'),
('question-3', 'test-1', 'short_answer', '请简述勾股定理并举一个应用场景。', '在直角三角形中，两条直角边的平方和等于斜边的平方。可用于求旗杆高度或楼梯长度。', 60, 3, '答出 a²+b²=c² 并给出实际应用即可得分。', '2026-03-10 08:00:00', '2026-03-10 08:00:00'),
('question-4', 'test-3', 'single_choice', '《春晓》的作者是谁？', 'A', 20, 1, '《春晓》作者是孟浩然。', '2026-03-09 14:00:00', '2026-03-09 14:00:00'),
('question-5', 'test-3', 'fill_blank', '“海内存知己，天涯若比邻”的作者是 ____。', '王勃', 30, 2, '出自王勃《送杜少府之任蜀州》。', '2026-03-09 14:00:00', '2026-03-09 14:00:00'),
('question-6', 'test-3', 'short_answer', '请简述古诗赏析时常见的两个角度。', '可从意象意境、修辞手法、情感主旨、结构层次等角度展开。', 50, 3, '答出任意两个常见角度并展开即可。', '2026-03-09 14:00:00', '2026-03-09 14:00:00');

INSERT INTO test_question_options (id, question_id, label, content, sort_order) VALUES
('option-1', 'question-1', 'A', '5', 1),
('option-2', 'question-1', 'B', '7', 2),
('option-3', 'question-1', 'C', '8', 3),
('option-4', 'question-1', 'D', '9', 4),
('option-5', 'question-4', 'A', '孟浩然', 1),
('option-6', 'question-4', 'B', '王维', 2),
('option-7', 'question-4', 'C', '李白', 3),
('option-8', 'question-4', 'D', '杜甫', 4);

INSERT INTO test_submissions (id, test_id, student_id, student_no, total_score, status, submitted_at, graded_at, analysis_summary, appeal_reason, appeal_status, created_at, updated_at) VALUES
('submission-1', 'test-1', 'student-1', 'S202601', 90.00, 'graded', '2026-03-10 09:30:00', '2026-03-10 10:00:00', '函数代入题完成较好，简答题表达较完整。', NULL, NULL, '2026-03-10 09:00:00', '2026-03-10 10:00:00'),
('submission-2', 'test-3', 'student-1', 'S202601', 82.00, 'graded', '2026-03-09 15:10:00', '2026-03-09 17:00:00', '基础识记较好，赏析题可加强结构化表达。', '第 3 题答案要点已覆盖，申请复核。', 'pending', '2026-03-09 15:00:00', '2026-03-10 09:20:00'),
('submission-3', 'test-1', 'student-2', 'S202602', 55.00, 'submitted', '2026-03-10 09:45:00', NULL, NULL, NULL, NULL, '2026-03-10 09:40:00', '2026-03-10 09:45:00');

INSERT INTO submission_answers (submission_id, question_id, answer, score, feedback, is_correct, updated_at) VALUES
('submission-1', 'question-1', 'B', 20.00, '回答正确', 1, '2026-03-10 10:00:00'),
('submission-1', 'question-2', '5', 20.00, '回答正确', 1, '2026-03-10 10:00:00'),
('submission-1', 'question-3', '勾股定理是直角三角形两直角边平方和等于斜边平方，可用于计算斜坡或梯子长度。', 50.00, '定理表述正确，应用场景举例合理。', 1, '2026-03-10 10:00:00'),
('submission-2', 'question-4', 'A', 20.00, '回答正确', 1, '2026-03-09 17:00:00'),
('submission-2', 'question-5', '王勃', 22.00, '答案正确，但表达可更完整。', 1, '2026-03-09 17:00:00'),
('submission-2', 'question-6', '可以从意象意境和情感主旨两个角度分析。', 40.00, '方向正确，论述略简。', 1, '2026-03-09 17:00:00'),
('submission-3', 'question-1', 'C', 0.00, NULL, 0, '2026-03-10 09:45:00'),
('submission-3', 'question-2', '5', 20.00, NULL, 1, '2026-03-10 09:45:00'),
('submission-3', 'question-3', '勾股定理可以用来求三角形边长。', NULL, NULL, NULL, '2026-03-10 09:45:00');

SET FOREIGN_KEY_CHECKS = 1;
