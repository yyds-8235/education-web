# Student Learning Profile API

This document describes the backend contract for the student learning profile page.

## Routes

- Page: `/students`
- Detail page: `/students/:id/learning`

## Recommended endpoints

### Teacher side

```http
GET /api/teacher/students/{studentId}/learning-profile
```

### Admin side

```http
GET /api/admin/students/xq/{studentId}/learning-profile
```

## Response shape

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "student": {
      "id": "student-1",
      "studentNo": "S202601",
      "name": "王同学",
      "username": "student01",
      "grade": "初二",
      "className": "2班",
      "guardian": "王家长",
      "phone": "13900000001",
      "email": "student01@example.com",
      "tags": ["重点关注", "在修课程 2 门"]
    },
    "overview": {
      "totalCourses": 2,
      "activeCourses": 2,
      "averageProgress": 72.5,
      "totalTests": 3,
      "completedTests": 2,
      "averageScore": 88,
      "pendingTests": 1,
      "latestActivityAt": "2026-03-11T08:30:00Z"
    },
    "courses": [],
    "tests": [],
    "trend": [],
    "activities": [],
    "insights": []
  }
}
```

## Source tables

Course-side aggregation can reuse:

- `courses`
- `course_chapters`
- `course_resources`
- `course_students`

Test-side aggregation can reuse:

- `tests`
- `test_questions`
- `test_submissions`
- `submission_answers`

## Notes

- `averageProgress` should be in the `0-100` range.
- `studentScore` should come from `test_submissions.total_score`.
- `questionCount` should come from `test_questions`.
- `objectiveCorrectRate` can be aggregated from `submission_answers.is_correct`.
- `submissionStatus` is recommended as `not_started | draft | submitted | graded`.

## Frontend fallback

The frontend currently tries these sources in order:

1. `GET /api/teacher/students/{studentId}/learning-profile`
2. `GET /api/admin/students/xq/{studentId}/learning-profile`
3. Local mock aggregation fallback
