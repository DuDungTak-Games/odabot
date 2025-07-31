# 🤖 ODA Bot

Node.js + Express + MySQL + Discord.js + React 기반의 향상된 Discord 봇 프로젝트

## 📂 프로젝트 구조

```
oda-bot/
├── bot/                # 디스코드 봇 코드
│   ├── index.js        # 디스코드 봇 진입점 (슬래시 커맨드 지원)
│   ├── commands/       # 슬래시 커맨드 파일들
│   ├── events/         # 이벤트 핸들러 파일들  
│   └── utils/
│       └── channels.js # 채널 관리 유틸리티
├── server/             # Express API 서버
│   ├── index.js        # Express 서버 진입점
│   ├── db.js           # MySQL 연결 설정
│   ├── routes/         # API 라우터
│   │   ├── timeline.js    # 타임라인 API
│   │   ├── random.js      # 랜덤 메시지 API
│   │   ├── stats.js       # 통계 API
│   │   ├── messages.js    # 메시지 저장 API
│   │   ├── channels.js    # 채널 관리 API
│   │   ├── users.js       # 사용자 정보 API
│   │   └── leaderboard.js # 리더보드 API
│   └── db/
│       ├── knexfile.js      # knex 환경 설정
│       ├── migrations/      # 마이그레이션 파일들
│       ├── seeds/           # 초기 데이터
│       └── schema.sql       # 스키마 전체 덤프
├── client/             # React 프론트엔드
├── channels.json       # 등록된 채널 정보 (자동 생성)
├── .env.example        # 환경변수 예시
├── package.json        # 프로젝트 의존성
└── README.md           # 이 파일
```

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 프로젝트 클론 및 이동
cd oda-bot

# 의존성 설치 (루트 + 클라이언트)
npm run setup

# 환경변수 설정
cp .env.example .env
# .env 파일을 편집하여 실제 값 입력
```

### 2. 데이터베이스 설정

#### MySQL 직접 설치 방법
```bash
# Ubuntu에서 MySQL 설치
sudo apt update
sudo apt install mysql-server

# MySQL 접속
sudo mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE odabot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'odabot_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON odabot.* TO 'odabot_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 스키마 적용 (빠른 방법)
```bash
# 전체 스키마를 한 번에 적용
mysql -u root -p odabot < server/db/schema.sql
```

#### 마이그레이션 사용 (개발 권장)
```bash
# 마이그레이션 실행
npm run migrate:latest

# 초기 데이터 입력
npm run seed:run
```

### 3. 실행

#### 개발 모드 (전체 실행)
```bash
# 봇 + 서버 + 클라이언트 동시 실행
npm run dev:all
```

#### 개별 실행
```bash
# Express 서버만 실행 (http://localhost:3001)
npm run dev:server

# Discord 봇만 실행
npm run dev:bot

# React 클라이언트만 실행 (http://localhost:3000)
npm run dev:client
```

#### 프로덕션 모드
```bash
# 서버 시작
npm start

# 별도 터미널에서 봇 실행
node bot/index.js
```

## ✨ 업데이트된 주요 변경사항

### 🔧 Discord Bot 개선사항

1. **슬래시 커맨드 시스템**
   - 모듈식 명령어 구조로 확장성 향상
   - 자동 명령어 등록 및 로딩
   - 에러 처리 개선

2. **채널 관리 시스템**
   - `channels.json` 파일로 등록된 채널 관리
   - 채널별 메시지 수집 제어 가능
   - API를 통한 채널 추가/제거

### 🚀 API 서버 확장

1. **새로운 엔드포인트**
   - `/api/messages` - 메시지 저장 API
   - `/api/channels` - 채널 관리 API
   - `/api/users` - 사용자 정보 API (소셜 크레딧 조회)
   - `/api/leaderboard` - 소셜 크레딧 리더보드 API

2. **향상된 데이터 구조**
   - `guild_id`, `channel_id` 필드 추가
   - JSON 형태의 첨부파일 배열 지원
   - `social_credit` 필드로 사용자 점수 시스템 추가
   - 더 정확한 메시지 메타데이터

### 📊 데이터베이스 스키마 업데이트

**메시지 테이블 개선:**

- `guild_id`: Discord 서버 식별자
- `channel_id`: Discord 채널 식별자  
- `attachments`: JSON 배열로 다중 첨부파일 지원

**사용자 테이블 확장:**

- `social_credit`: 사용자별 소셜 크레딧 점수 시스템

이제 메시지의 출처를 더 정확하게 추적하고, 사용자별 점수 시스템을 통한 리더보드 기능을 제공합니다.

## 🔧 환경변수 설정

`.env` 파일에 다음 값들을 설정하세요:

```env
# Discord Bot 설정
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here

# MySQL 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=odabot

# Express 서버 설정
PORT=3001
NODE_ENV=development

# CORS 설정 (프론트엔드 주소)
FRONTEND_URL=http://localhost:3000

# API 기본 주소 (Discord 봇과 클라이언트에서 사용)
API_BASE_URL=http://localhost:3001/api
```

## 📊 데이터베이스 스키마

### users 테이블

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY COMMENT 'Discord 사용자 ID',
    username VARCHAR(255) NOT NULL COMMENT 'Discord 사용자명',
    avatar_url VARCHAR(500) COMMENT 'Discord 아바타 URL',
    social_credit INT DEFAULT 0 COMMENT '소셜 크레딧 점수',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### messages 테이블

```sql
CREATE TABLE messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '메시지 고유 ID',
    user_id BIGINT NOT NULL COMMENT 'Discord 사용자 ID',
    guild_id BIGINT COMMENT 'Discord 서버 ID',
    channel_id BIGINT COMMENT 'Discord 채널 ID',
    content TEXT COMMENT '메시지 내용',
    attachments JSON COMMENT '첨부파일 URL 배열 (JSON 형태)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🛠 개발 명령어

```bash
# 의존성 설치
npm install                # 서버 의존성
npm run client:install     # 클라이언트 의존성
npm run setup              # 전체 설치

# 개발 서버 실행
npm run dev:server         # Express API 서버
npm run dev:bot            # Discord 봇
npm run dev:client         # React 클라이언트
npm run dev:all            # 모두 동시 실행

# 데이터베이스
npm run migrate:latest     # 마이그레이션 실행
npm run migrate:rollback   # 마이그레이션 롤백
npm run seed:run           # 시드 데이터 실행

# 빌드
npm run client:build       # React 앱 빌드
```

## 📡 API 엔드포인트

### 타임라인 API

- `GET /api/timeline` - 최신 메시지 목록
- `GET /api/timeline/user/:userId` - 특정 사용자 메시지
- `GET /api/timeline/search?q=검색어` - 메시지 검색

### 랜덤 API

- `GET /api/random?count=5` - 랜덤 메시지
- `GET /api/random/user/:userId` - 특정 사용자 랜덤 메시지
- `GET /api/random/images` - 이미지가 있는 랜덤 메시지
- `GET /api/random/texts` - 텍스트만 있는 랜덤 메시지

### 통계 API

- `GET /api/stats` - 전체 통계
- `GET /api/stats/users` - 사용자별 통계
- `GET /api/stats/daily` - 일별 메시지 통계
- `GET /api/stats/hourly` - 시간대별 통계
- `GET /api/stats/user/:userId` - 특정 사용자 상세 통계

### 메시지 API

- `POST /api/messages` - 메시지 저장 (봇에서 사용)

### 채널 관리 API

- `GET /api/channels` - 등록된 채널 목록 조회
- `DELETE /api/channels/:id` - 특정 채널 제거

### 사용자 API

- `GET /api/users/:id/credit` - 특정 사용자의 소셜 크레딧 정보 조회

### 리더보드 API

- `GET /api/leaderboard` - 소셜 크레딧 상위 10명 리더보드

### 시스템 API

- `GET /` - API 정보
- `GET /health` - 서버 및 DB 상태 확인

## 🎯 주요 기능

### Discord Bot

- **슬래시 커맨드 지원** - 모듈식 명령어 시스템
- **이벤트 핸들러** - 확장 가능한 이벤트 처리
- **채널 관리** - JSON 파일 기반 채널 등록/해제
- **메시지 수집** - 실시간 메시지 데이터베이스 저장
- **첨부파일 처리** - JSON 배열 형태로 다중 첨부파일 지원

### Express API

- **RESTful API 설계** - 표준화된 REST 엔드포인트
- **CORS 허용** - 프론트엔드 연동 지원
- **MySQL 연결 풀** - 효율적인 데이터베이스 연결 관리
- **에러 처리 및 로깅** - 체계적인 오류 관리
- **새로운 API** - 메시지 저장 및 채널 관리 기능

### React Dashboard

- **실시간 메시지 타임라인** - 최신 메시지 표시
- **랜덤 메시지 조회** - 다양한 조건의 랜덤 메시지
- **상세 통계 대시보드** - 종합적인 데이터 분석
- **반응형 디자인** - 모바일 친화적 UI

### 데이터베이스

- **Knex.js 마이그레이션** - 체계적인 스키마 관리
- **인덱스 최적화** - 쿼리 성능 향상
- **외래키 제약조건** - 데이터 무결성 보장
- **JSON 필드 지원** - 첨부파일 배열 저장
- **UTF8MB4 지원** - 이모지 및 특수문자 완벽 지원

## 🌐 서버 배포

### 애플리케이션 VM (Ubuntu 24)
```bash
# Node.js 20.x 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2로 프로세스 관리
npm install -g pm2

# 봇과 서버 동시 실행
pm2 start ecosystem.config.js
```

### DB VM (MySQL 8.x)
```bash
# MySQL 설치 및 보안 설정
sudo apt install mysql-server
sudo mysql_secure_installation

# 내부 IP만 허용 (my.cnf)
bind-address = 10.0.0.x  # 내부 IP
```

## 🔒 보안 고려사항

- Discord 봇 토큰 보안 관리
- MySQL 외부 접속 차단
- CORS 도메인 제한
- 환경변수로 민감 정보 관리
- SQL Injection 방지 (Prepared Statements)

## 🚨 문제 해결

### 봇이 시작되지 않는 경우
1. Discord 토큰 확인
2. 봇 권한 설정 확인 (메시지 읽기, 메시지 기록 보기)
3. 인텐트 설정 확인

### API 연결 실패
1. Express 서버 실행 상태 확인
2. MySQL 연결 상태 확인 (`/health` 엔드포인트)
3. CORS 설정 확인

### 프론트엔드 오류
1. API 서버 주소 확인
2. 브라우저 개발자 도구 콘솔 확인
3. 네트워크 탭에서 API 호출 상태 확인

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 있으시면 Issues 탭에서 문의해주세요.
