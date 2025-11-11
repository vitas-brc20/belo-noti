# 최애의 알리미 (My Bias's Notifier)

"최애의 알리미"는 사용자가 좋아하는 연예인이나 캐릭터(최애)의 말투로 개인화된 푸시 알림을 받을 수 있는 서비스입니다. 사용자는 원하는 시간과 주기를 설정하여, 마치 최애로부터 직접 메시지를 받는 듯한 경험을 할 수 있습니다.

## ✨ 주요 기능

- **맞춤 알림 구독**: 사용자는 자신의 기기(FCM 토큰)를 등록하고, 알림을 받고 싶은 '최애'의 이름과 '말투'를 설정할 수 있습니다.
- **유연한 알림 스케줄**: 알림을 한 번만 받거나, 1시간, 6시간, 12시간, 24시간 주기로 반복해서 받을 수 있습니다.
- **AI 기반 개인화 메시지**: Google의 Gemini AI를 사용하여 설정된 '최애'의 말투와 톤에 맞춰 매번 새로운 알림 메시지를 생성합니다.
- **정시 알림 전송**: 예약된 시간에 맞춰 Firebase Cloud Messaging (FCM)을 통해 사용자에게 푸시 알림을 정확하게 전달합니다.

## ⚙️ 아키텍처 및 작동 방식

이 프로젝트는 서버리스 아키텍처를 기반으로 구축되었습니다.

- **프론트엔드 (React PWA)**: 사용자가 알림을 구독하고 관리할 수 있는 웹 애플리케이션입니다. (현재 프로젝트 구조 기반으로 추정)
- **백엔드 (Vercel Serverless Functions)**: API 요청을 처리하는 서버리스 함수입니다.
  - `/api/subscribe`: 사용자의 구독 정보(FCM 토큰, 최애 정보, 알림 스케줄)를 받아 Supabase 데이터베이스에 저장합니다.
  - `/api/unsubscribe`: 사용자의 구독을 해지하고 데이터베이스에서 삭제합니다.
  - `/api/send-notifications`: 주기적으로 실행되어 알림을 보낼 시간이 된 사용자에게 AI로 생성된 메시지를 FCM을 통해 전송합니다.
- **데이터베이스 (Supabase)**: PostgreSQL 기반의 Supabase를 사용하여 사용자의 구독 정보를 안전하게 저장하고 관리합니다.
- **인공지능 (Google Gemini)**: 사용자가 설정한 최애의 특징에 맞는 개인화된 알림 메시지를 생성합니다.
- **푸시 알림 (Firebase Cloud Messaging)**: 생성된 메시지를 사용자의 디바이스로 안정적으로 전송합니다.
- **스케줄러 (GitHub Actions)**: Cron 표현식을 사용하여 주기적으로 `/api/send-notifications` 엔드포인트를 호출하여 알림 전송 로직을 트리거합니다.

## 🚀 시작하기

프로젝트를 로컬 환경에서 설정하고 실행하는 방법은 다음과 같습니다.

### 1. 저장소 복제

```bash
git clone https://github.com/your-username/belo-noti.git
cd belo-noti
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

프로젝트 루트 디렉터리에 `.env.local` 파일을 생성하고 아래의 환경 변수들을 설정해야 합니다.

```
# Supabase
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Firebase
FIREBASE_SERVICE_ACCOUNT_JSON_BASE64=YOUR_FIREBASE_SERVICE_ACCOUNT_JSON_BASE64

# Gemini AI
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Cron Job Security
CRON_SECRET=YOUR_SECURE_RANDOM_STRING
```

**환경 변수 설명:**
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: Supabase 프로젝트 대시보드에서 확인할 수 있습니다.
- `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64`: Firebase 프로젝트의 서비스 계정 키(JSON 파일)를 Base64로 인코딩한 값입니다.
- `GEMINI_API_KEY`: Google AI Studio에서 발급받은 API 키입니다.
- `CRON_SECRET`: GitHub Actions와 같은 외부 스케줄러에서 API를 호출할 때 인증을 위해 사용하는 임의의 보안 문자열입니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

## 🌐 API 엔드포인트

`/api` 디렉터리에 위치한 서버리스 함수들입니다.

- **`POST /api/subscribe`**: 새로운 알림 구독을 생성합니다.
- **`POST /api/unsubscribe`**: 기존 알림 구독을 해지합니다.
- **`GET /api/send-notifications`**: 스케줄러에 의해 호출되며, 보낼 시간이 된 모든 알림을 처리하여 발송합니다.
- **`GET /api/check-rewards`**: (예시) 특정 조건을 확인하고 알림을 보내는 또 다른 예시 API입니다.