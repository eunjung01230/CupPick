# Security

- secret, token, password, private key를 source code에 넣지 않는다.
- `.env` 계열 파일 내용을 읽거나 출력하지 않는다.
- 로그에 인증정보/개인정보를 남기지 않는다.
- 클라이언트 입력은 server에서 다시 검증한다.
- 인증(authentication)과 인가(authorization)를 구분한다.
- UI에서 버튼을 숨기는 것을 권한 검증으로 간주하지 않는다.
- SQL/query/path/url을 사용자 입력과 단순 문자열 결합하지 않는다.
- 새로운 dependency는 필요성과 유지보수 상태를 확인한 뒤 추가한다.
- 보안에 영향을 주는 변경은 PR의 위험 범위에 명시한다.
