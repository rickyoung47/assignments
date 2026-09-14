# 소수 판별기

정수를 입력하면 해당 수가 소수인지 판별하는, 의존성 없는 정적 웹앱입니다.

## 기능

- 양수·음수·0을 포함한 정수 입력 지원
- 소수 여부 및 잘못된 입력 안내
- 모바일 화면에 맞춘 반응형 UI

## 로컬 실행

프로젝트 폴더에서 아래 명령을 실행한 뒤 브라우저에서 `http://localhost:8000`을 여세요.

```bash
python3 -m http.server 8000
```

## Cloudflare Pages 배포 설정

- Framework preset: `None`
- Build command: 비워 둠
- Build output directory: `/`
