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
│       ├── channels.js      # 채널 관리 유틸리티
│       └── voiceTranscriber.js # 20ms PCM 스트림 WebSocket 브리지
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
├── stt-worker/         # whisper.cpp 실시간 STT 워커 (WebSocket 서버)
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

# STT 워커 의존성 설치
cd stt-worker && npm install
cd ..

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

# STT 워커(WebSocket + whisper.cpp 브리지)
npm run dev:stt

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

### 4. whisper.cpp 스트리밍 워커 준비

1. **whisper.cpp 빌드 및 모델 다운로드**
   ```bash
   git clone https://github.com/ggerganov/whisper.cpp.git
   cd whisper.cpp && make
   # 예시 모델 다운로드 (필요한 언어/크기에 맞게 교체)
   ./models/download-ggml-model.sh base
   ```

2. **환경변수로 실행 파일·모델 경로 지정**
   - `WHISPER_BIN` : `whisper.cpp/main` 실행 파일 경로
   - `WHISPER_MODEL` : `ggml-*.bin` 모델 파일 경로
   - `WHISPER_LANGUAGE` : (선택) 강제 언어 코드, 미설정 시 whisper 자동 감지
   - `WHISPER_ARGS` : (선택) 추가 인자 (`--threads 6 --max-context 0` 등)

3. **STT 워커 실행**
   ```bash
   # 루트 디렉터리에서
   npm run dev:stt
   ```

4. **실시간 디스코드 음성 브리지 실행**
   ```bash
   npm run dev:bot
   ```

봇이 음성 채널에 입장하는 즉시 20ms 단위 PCM이 워커에 전달되며, whisper.cpp의 부분 전사 결과가 API 서버로 중계됩니다.

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

3. **실시간 음성 스트리밍 브리지**
   - Opus 패킷을 즉시 48kHz PCM으로 풀고 16kHz 모노로 다운샘플링
   - 20ms 단위 청크를 WebSocket으로 STT 워커에 전송
   - whisper.cpp에서 나온 부분 전사를 100~200ms 이내로 수신

### 🚀 API 서버 확장

1. **새로운 엔드포인트**
   - `/api/messages` - 메시지 저장 API
   - `/api/channels` - 채널 관리 API
   - `/api/users` - 사용자 정보 API (소셜 크레딧 조회)
   - `/api/leaderboard` - 소셜 크레딧 리더보드 API
   - `/api/stt/partial` - whisper.cpp 부분 전사 수신 API

2. **향상된 데이터 구조**
   - `guild_id`, `channel_id` 필드 추가
   - JSON 형태의 첨부파일 배열 지원
   - `social_credit` 필드로 사용자 점수 시스템 추가
   - 더 정확한 메시지 메타데이터

### 🧠 STT 워커

1. **WebSocket 세션 관리**
   - 봇으로부터 받은 `start`/`stop` 메시지에 따라 whisper.cpp 프로세스를 생성·정리합니다.
   - 세션 UUID와 길드/채널/사용자 ID를 매핑하여 후속 처리를 단순화합니다.

2. **whisper.cpp 스트리밍**
   - `--stream --no-timestamps --sample-rate 16000 -f -` 옵션으로 stdin/stdout 파이프를 구성합니다.
   - stdout에서 발생한 각 라인을 실시간으로 `/api/stt/partial`에 POST합니다.

3. **장애 복구**
   - whisper.cpp 프로세스 종료·에러 시 세션을 종료하고 봇 WebSocket을 닫아 누수되는 리소스를 방지합니다.
   - 마지막 전사 내용을 `isFinal=true`로 한 번 더 전송해 문장을 확정할 수 있습니다.

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

# 실시간 STT 설정
STT_WORKER_WS_URL=ws://localhost:4002
STT_PARTIAL_ENDPOINT=http://localhost:3001/api/stt/partial
STT_WORKER_PORT=4002
WHISPER_BIN=/path/to/whisper.cpp/main
WHISPER_MODEL=/path/to/models/ggml-base.bin
# WHISPER_LANGUAGE=ko
# WHISPER_ARGS=--threads 6 --max-context 0
```

## 🔊 실시간 STT 파이프라인

### 구성 요소 요약
- **Discord 봇 (`bot/utils/voiceTranscriber.js`)**: Discord 수신기의 Opus 패킷을 즉시 PCM으로 변환하고, 20ms(960 프레임) 단위로 16kHz 모노 PCM을 만들어 WebSocket으로 전송합니다.
- **STT 워커 (`stt-worker/index.js`)**: WebSocket 세션마다 whisper.cpp를 스트리밍 모드로 실행하고, stdin에 PCM 청크를 공급하며 stdout에서 나오는 부분 전사를 API 서버로 전달합니다.
- **API 서버 (`server/routes/stt.js`)**: `/api/stt/partial` 엔드포인트에서 워커가 보낸 텍스트를 수신해 로그/후속 처리를 담당합니다.

### 데이터 흐름 (20ms 청크)
1. 디스코드 리시버가 20ms Opus 프레임을 emit → `prism-media` 디코더가 48kHz 스테레오 PCM을 생성합니다.
2. `voiceTranscriber`가 3:1 다운샘플링으로 16kHz 모노 PCM을 만들고 즉시 WebSocket 바이너리 프레임으로 보냅니다.
3. STT 워커가 청크를 whisper.cpp stdin에 연속으로 주입합니다 (`--stream`).
4. whisper.cpp가 stdout으로 출력한 각 라인을 곧바로 `/api/stt/partial`로 POST하여 100~200ms 수준의 지연으로 부분 전사를 수신합니다.

### WebSocket 메시지 포맷
```text
제어(start/stop) 메시지 → JSON 텍스트 프레임
오디오 데이터 → 16kHz 모노 PCM(s16le) 바이너리 프레임 (20ms = 320 샘플)
```

```jsonc
// start 예시
{
  "type": "start",
  "sessionId": "uuid",
  "guildId": "123456789012345678",
  "channelId": "987654321098765432",
  "userId": "112233445566778899",
  "sampleRate": 16000,
  "format": "s16le",
  "chunkMillis": 20
}
```

### whisper.cpp 실행 옵션 예시
```bash
$WHISPER_BIN \
  -m $WHISPER_MODEL \
  --stream \
  --no-timestamps \
  --sample-rate 16000 \
  -f - \
  --threads 6 --max-context 0
```

### 지연 최소화를 위한 팁
- 워커와 whisper.cpp는 동일 머신에 두고, 가능하면 GPU가 아닌 CPU 전용으로 가벼운 모델( base / small 등)을 사용합니다.
- `WHISPER_ARGS`에 `--max-context 0` 또는 `--no-context`를 설정하면 누적 문맥 재사용으로 인한 지연을 줄일 수 있습니다.
- WebSocket이 끊어지면 봇이 즉시 `stop` 메시지를 전송해 세션을 정리하므로, whisper.cpp 프로세스가 남아있지 않은지 주기적으로 모니터링하세요.

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
npm run dev:stt            # whisper.cpp STT 워커
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

### STT API

- `POST /api/stt/partial` - whisper.cpp 부분 전사 수신 (STT 워커가 호출)

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
- **실시간 음성 인식 브리지** - 20ms PCM 청크를 STT 워커로 스트리밍

### Express API

- **RESTful API 설계** - 표준화된 REST 엔드포인트
- **CORS 허용** - 프론트엔드 연동 지원
- **MySQL 연결 풀** - 효율적인 데이터베이스 연결 관리
- **에러 처리 및 로깅** - 체계적인 오류 관리
- **새로운 API** - 메시지 저장 및 채널 관리 기능
- **실시간 전사 수신** - `/api/stt/partial`로 whisper.cpp 부분 전사를 처리

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
