# 后端对接文档：登录与教务处学生管理 API

## 1. 适用范围

本文档用于对接以下前端模块：

- 登录模块：`src/pages/Login/Login.tsx`、`src/store/slices/authSlice.ts`
- 教务处学生管理模块：`src/pages/Student/StudentManagement.tsx`（admin 视图）

并与以下数据表保持一致：

- `users`
- `student_profiles`
- `teacher_profiles`（登录角色信息扩展）

## 2. 全局约定

### 2.1 基础地址

- Base URL：`http://localhost:8082/api`

### 2.2 鉴权方式

- Header：`Authorization: <token>`
- 注意：当前前端请求拦截器未拼接 `Bearer `，后端需直接接受纯 token。

### 2.3 统一响应格式（必须）

前端 `request.ts` 约定响应为：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

规则：

- `code = 0` 或 `code = 200` 视为成功。
- 其他 `code` 视为失败，前端统一弹错。

### 2.4 时间与字段格式

- 时间字段：ISO 8601 字符串（示例：`2026-03-05T08:30:00.000Z`）
- 布尔字段：JSON `true/false`
- 分页：`page` 从 `1` 开始

### 2.5 角色权限

- 仅 `admin` 可访问 `/admin/students/**`
- 登录后返回 `user.role`，供前端路由与菜单控制

### 2.6 账号与角色识别规则（新增）

- 所有角色共用同一个登录接口：`POST /auth/login`
- 账号前缀规则：
| 账号规则 | 角色 |
|---|---|
| `stu*` | 学生（student） |
| `tch*` | 教师（teacher） |
| `admin` | 管理员（admin，固定单账号） |
- 管理员不单独建 `admin_profiles` 表，管理员信息直接维护在 `users` 表中。

## 3. 登录相关接口

---

### 3.1 用户登录

- Method: `POST`
- Path: `/auth/login`
- Auth: 否

#### 请求体

```json
{
  "username": "admin",
  "password": "123456"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | 是 | 登录账号，对应 `users.username`；按前缀识别角色（`stu*`/`tch*`/`admin`） |
| password | string | 是 | 明文密码（服务端校验哈希） |

#### 成功响应（`data`）

```json
{
  "token": "jwt-or-session-token",
  "expiresIn": 86400,
  "user": {
    "id": "admin-1",
    "username": "admin",
    "realName": "教务处管理员",
    "email": "admin@example.com",
    "phone": "13700000000",
    "avatar": "",
    "role": "admin",
    "status": "active",
    "createdAt": "2026-03-01T00:00:00.000Z",
    "updatedAt": "2026-03-05T00:00:00.000Z"
  }
}
```

字段需严格兼容 `src/types/user.ts` 的 `LoginResponse` 与 `User`。

#### 失败场景

| code | message | 场景 |
|---|---|---|
| 401 | 用户名或密码错误 | 凭据错误 |
| 422 | 账号前缀不合法 | 非 `stu*` / `tch*` / `admin` |
| 403 | 账号已禁用 | `users.status != active` |
| 500 | 系统错误 | 服务异常 |

---

### 3.2 获取当前登录用户

- Method: `GET`
- Path: `/auth/me`
- Auth: 是

用于替代当前 `fetchCurrentUser` 的本地 token 反查逻辑。

#### 成功响应（`data`）

```json
{
  "id": "admin-1",
  "username": "admin",
  "realName": "教务处管理员",
  "email": "admin@example.com",
  "phone": "13700000000",
  "avatar": "",
  "role": "admin",
  "status": "active",
  "createdAt": "2026-03-01T00:00:00.000Z",
  "updatedAt": "2026-03-05T00:00:00.000Z"
}
```

#### 失败场景

| code | message | 场景 |
|---|---|---|
| 401 | 未登录或登录已过期 | token 无效/过期 |
| 403 | 无权限访问 | 角色异常 |

---

### 3.3 退出登录（可选）

- Method: `POST`
- Path: `/auth/logout`
- Auth: 是

前端目前可仅清本地 token；如后端有黑名单/会话失效要求，建议实现。

## 4. 教务处学生管理接口（Admin）

说明：以下接口围绕 `users + student_profiles` 设计，并兼容前端 `StudentProfile` 字段。

---

### 4.1 学生列表（分页 + 筛选 + 检索）

- Method: `GET`
- Path: `/admin/students`
- Auth: 是（admin）

#### Query 参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | number | 否 | 默认 1 |
| pageSize | number | 否 | 默认 10 |
| keyword | string | 否 | 学号/姓名/账号/标签模糊检索 |
| grade | string | 否 | 年级筛选 |
| class | string | 否 | 班级筛选 |
| archiveFilter | string | 否 | `funded` 或 `非困难/一般困难/困难/特别困难` |
| canView | boolean | 否 | 按查看权限筛选 |
| canEdit | boolean | 否 | 按编辑权限筛选 |

#### 成功响应（`data`）

```json
{
  "list": [
    {
      "id": "student-1",
      "studentNo": "S2026001",
      "name": "王同学",
      "username": "stu0001",
      "grade": "初一",
      "class": "1班",
      "guardian": "家长1",
      "syncedAt": "2026-03-05 09:20:00",
      "povertyLevel": "一般困难",
      "isSponsored": true,
      "householdType": "城镇",
      "isLeftBehind": false,
      "isDisabled": false,
      "isSingleParent": false,
      "isKeyConcern": false,
      "canView": true,
      "canEdit": true
    }
  ],
  "total": 120,
  "page": 1,
  "pageSize": 10,
  "totalPages": 12
}
```

说明：字段命名与前端页面保持一致（使用 `class`，非 `class_name`）。

---

### 4.2 学生详情

- Method: `GET`
- Path: `/admin/students/{studentId}`
- Auth: 是（admin）

#### Path 参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| studentId | string | 是 | 学生用户 ID（`users.id`） |

#### 成功响应（`data`）

同 4.1 列表单项结构。

---

### 4.3 新增学生

- Method: `POST`
- Path: `/admin/students`
- Auth: 是（admin）

#### 请求体

```json
{
  "studentNo": "S2026999",
  "name": "新同学",
  "username": "stu0999",
  "password": "123456",
  "grade": "高一",
  "class": "1班",
  "guardian": "家长X",
  "povertyLevel": "非困难",
  "isSponsored": false,
  "householdType": "城镇",
  "isLeftBehind": false,
  "isDisabled": false,
  "isSingleParent": false,
  "isKeyConcern": false,
  "canView": true,
  "canEdit": true,
  "email": "stu0999@example.com",
  "phone": "13900009999"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| studentNo | string | 是 | 学号，唯一 |
| name | string | 是 | 姓名，映射 `users.real_name` |
| username | string | 是 | 登录账号，唯一，必须以 `stu` 开头 |
| password | string | 是 | 初始密码 |
| grade | string | 是 | 年级 |
| class | string | 是 | 班级 |
| guardian | string | 否 | 监护人 |
| povertyLevel | enum | 是 | 贫困等级 |
| isSponsored | boolean | 是 | 是否资助对象 |
| householdType | enum | 是 | 户籍类型 |
| isLeftBehind | boolean | 是 | 是否留守 |
| isDisabled | boolean | 是 | 是否残疾 |
| isSingleParent | boolean | 是 | 是否单亲 |
| isKeyConcern | boolean | 是 | 是否重点关注 |
| canView | boolean | 是 | 查看权限 |
| canEdit | boolean | 是 | 编辑权限 |
| email | string | 否 | 邮箱 |
| phone | string | 否 | 手机号 |

#### 成功响应（`data`）

返回新增后的学生对象（同 4.1 单项结构）。

#### 失败场景

| code | message | 场景 |
|---|---|---|
| 409 | 学号已存在 | `student_profiles.student_no` 冲突 |
| 409 | 用户名已存在 | `users.username` 冲突 |
| 422 | 用户名前缀非法 | 非 `stu*` |
| 422 | 参数校验失败 | 缺失必填字段 |

---

### 4.4 更新学生

- Method: `PUT`
- Path: `/admin/students/{studentId}`
- Auth: 是（admin）

#### 请求体

与 4.3 基本一致，但 `username`、`studentNo` 建议可改可不改（由业务决定）。  
若支持重置密码，可额外提供 `password` 字段（可选）。

#### 成功响应（`data`）

返回更新后的学生对象（同 4.1 单项结构）。

---

### 4.5 删除学生

- Method: `DELETE`
- Path: `/admin/students/{studentId}`
- Auth: 是（admin）

#### 成功响应（`data`）

```json
{
  "id": "student-1"
}
```

删除建议：

- 逻辑删除优先（`users.status = inactive`），避免历史记录断链。
- 如物理删除，需先清理关联数据（选课、测试提交、考勤、签到等）。

---

### 4.6 更新学生权限（查看/编辑）

- Method: `PATCH`
- Path: `/admin/students/{studentId}/permissions`
- Auth: 是（admin）

#### 请求体

```json
{
  "canView": true,
  "canEdit": false
}
```

约束建议：

- 当 `canView = false` 时，`canEdit` 自动置 `false`（与前端逻辑一致）。

#### 成功响应（`data`）

```json
{
  "studentId": "student-1",
  "canView": true,
  "canEdit": false,
  "updatedAt": "2026-03-05T10:00:00.000Z"
}
```

---

### 4.7 批量同步学生档案/学情数据

- Method: `POST`
- Path: `/admin/students/sync`
- Auth: 是（admin）

#### 请求体（可选）

```json
{
  "studentIds": ["student-1", "student-2"]
}
```

说明：

- 为空则全量同步。
- 非空则按 ID 增量同步。

#### 成功响应（`data`）

```json
{
  "syncedCount": 2,
  "syncedAt": "2026-03-05 10:05:00",
  "failed": []
}
```

---

### 4.8 学生管理元数据（可选）

- Method: `GET`
- Path: `/admin/students/meta`
- Auth: 是（admin）

用于下拉数据动态化，避免前端硬编码。

#### 成功响应（`data`）

```json
{
  "grades": ["初一", "初二", "初三", "高一", "高二", "高三"],
  "classes": ["1班", "2班", "3班", "4班"],
  "povertyLevels": ["非困难", "一般困难", "困难", "特别困难"],
  "householdTypes": ["城镇", "农村"]
}
```

## 5. 数据库字段映射（关键）

### 5.1 `users` 与 API 字段映射

| API 字段 | 数据库字段 |
|---|---|
| id | users.id |
| username | users.username |
| name/realName | users.real_name |
| email | users.email |
| phone | users.phone |
| role | users.role |
| status | users.status |
| createdAt | users.created_at |
| updatedAt | users.updated_at |

### 5.2 `student_profiles` 与 API 字段映射

| API 字段 | 数据库字段 |
|---|---|
| studentId / id | student_profiles.student_id |
| studentNo | student_profiles.student_no |
| grade | student_profiles.grade |
| class | student_profiles.class_name |
| guardian | student_profiles.guardian |
| povertyLevel | student_profiles.poverty_level |
| isSponsored | student_profiles.is_sponsored |
| householdType | student_profiles.household_type |
| isLeftBehind | student_profiles.is_left_behind |
| isDisabled | student_profiles.is_disabled |
| isSingleParent | student_profiles.is_single_parent |
| isKeyConcern | student_profiles.is_key_concern |
| canView | student_profiles.can_view |
| canEdit | student_profiles.can_edit |
| syncedAt | student_profiles.synced_at |

## 6. 错误码建议

| code | 含义 | 典型场景 |
|---|---|---|
| 0 | 成功 | 通用成功 |
| 200 | 成功 | 通用成功（兼容） |
| 400 | 请求错误 | 参数格式错误 |
| 401 | 未认证 | token 无效/过期 |
| 403 | 无权限 | 非 admin 访问 admin 接口 |
| 404 | 资源不存在 | 用户或学生不存在 |
| 409 | 资源冲突 | 学号或用户名重复 |
| 422 | 校验失败 | 必填字段缺失/枚举非法/账号前缀不符合规则 |
| 500 | 服务器异常 | 未知错误 |

## 7. 与当前前端代码的对接建议

1. `authSlice` 目前使用 mock 登录，可替换为 `request.post('/auth/login')`。  
2. `fetchCurrentUser` 建议改为调用 `/auth/me`。  
3. 所有角色均使用同一个登录接口，后端按用户名前缀返回角色。  
4. `StudentManagement`（admin）当前使用本地 `profiles`，建议迁移接口：`GET /admin/students`、`POST /admin/students`、`PUT /admin/students/{id}`、`DELETE /admin/students/{id}`、`PATCH /admin/students/{id}/permissions`、`POST /admin/students/sync`。  
5. API 返回字段尽量直接使用前端字段名（如 `class`、`studentNo`），减少前端适配成本。  
