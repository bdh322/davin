# 기술 워크플로우·아키텍처 (ARCH)

> 상태: 초안 · 최종수정 2026-10-01 · 출처: 트랙 C (공식 문서 ~90건, 검색 ~45건). 전문 보고서는 세션 스크래치에만 있었으므로 핵심을 여기에 보존.
> 표기: [A] 공식 문서·논문·당사 블로그·GitHub / [B] 전문 매체 / [C] 포럼·블로그 / [미확인]
> 관련: `03-content-formats.md`(포맷별 지연 허용), `06-risks-legal.md`(모더레이션·보안), `05-business-model.md`(비용→가격)

## 1. 레퍼런스 아키텍처 (ARCH-00)
```
 [LED/파사드/몰 스크린] ← QR + 짧은 URL + 룸코드 노출 (슬롯별 토큰, 정지 프레임 3초+)
          ▲ (렌더 경로 a/b/c)
 ┌────────┴────────┐   WebSocket(상태 델타)        ┌──────────────────────────┐
 │ Screen Renderer │◄──────────────────────────────│ Realtime Core             │
 │ HTML5 플레이어   │   + 스냅샷 URL(CDN, TTL 1s)     │ room = screen_id:slot     │
 │ /렌더박스/TD     │                                │ tick 10~30Hz, 집계·레이트리밋│
 └─────────────────┘                                │ Redis(bitfield/INCR/pubsub)│
      HTTPS(CDN) 정적 PWA   ┌──────────┐  WS/HTTP폴백 └───────▲─────┬──────────┘
 [폰 브라우저] ────────────►│Edge/CDN  │──────────────────────┘     ▼
  QR→https://brand.kr/s/<screen>/<slot>?t=<jwt>  +Turnstile    ┌──────────────┐
                            └──────────┘                       │ Moderation    │
                                                               │ 자동(API)→큐→ │
                                                               │ 사람 승인(30~90s)│
                                                               └──────┬───────┘
                                              [CMS/운영콘솔: 스크린 레지스트리·스케줄·QR 발급·모더레이션 큐·분석]
```
설계 원칙 5: ① 스크린 1개 = 룸 1개(샤딩 단위) ② 폰→서버는 "입력", 서버→스크린은 "집계된 상태"만 ③ 스냅샷(CDN)+델타(WS) ④ 사용자별 레이트리밋/쿨다운 ⑤ 스크린이 마스터 클럭.

## 2. 렌더/출력 경로 3종 (ARCH-01~03)
| ID | 경로 | 장점 | 단점/리스크 | 스크린당 비용 | 판매 포지션 |
|---|---|---|---|---|---|
| ARCH-01 | **(a) 플레이어 내장 HTML5** — 사이니지 플레이어 브라우저가 우리 웹앱 URL 실행, WS 수신 | 추가 HW 0, 원격 배포, 다수 스크린 확장 최적 | 엔진 편차(Chromium 45~120 혼재), 운영사 CMS 정책·파트너 인증서 장벽, WebGL/폰트/이모지 제약 | 0원 | **기본 제품(SaaS)** |
| ARCH-02 | **(b) 전용 렌더 박스** — TD/Unreal/Chromium 키오스크 PC → HDMI/SDI/NDI → LED 프로세서 외부 입력 | 렌더 품질·프레임 보장, 미디어서버 워크플로 그대로 | 운영사 외부입력 승인·현장 상주·EDID/HDCP, 박스 CAPEX | PC ₩100~300만+컨버터 | **이벤트 키트** |
| ARCH-03 | **(c) 기존 미디어서버 통합** — TD·Resolume·Pixera·disguise·Ventuz·Notch·Unreal에 레이어/파라미터 주입 | 기존 쇼컨트롤·타임라인·맵핑 재사용, 공연 최적 | 서버별 API·웹레이어 품질 상이, 운영자 협업 필수 | 통합 공수 | **공연/파사드 통합 옵션** |

실무 권장(ARCH-03): 미디어서버 웹 레이어로 전체 UI를 렌더하지 말 것. 서버엔 OSC/WebSocket/JSON-RPC로 **집계값(투표 비율·평균 좌표·트리거)만** 넣고, 텍스트/그림 UGC는 TD/Chromium 보조 렌더를 Spout/NDI로 합성하는 하이브리드.

### 2.1 사이니지 플레이어별 웹 실행 (ARCH-01 세부) [A, 확인 2026-10-01]
| 플레이어 | 웹 실행 방식 | 주의 |
|---|---|---|
| Samsung Tizen SSSP | URL Launcher, 또는 `sssp_config.xml`+서명 `.wgt`. MagicINFO "거의 모든 웹 표준" 재생 주장. VXT는 Tizen 6.5+ | Tizen 8.0에서 파트너 인증서 없으면 설치 실패(Error -3) [C]. 모델별 Chromium 버전 [미확인] |
| LG webOS Signage | SI Server 설정으로 IPK 자동 설치, SCAP/IDCAP API. 개발자 포털은 LG 승인 파트너 전용 | 파트너 승인 리드타임 |
| BrightSign | HTML5 Chromium. OS=브라우저 버전: 9.1.x=Chromium 120, 8.5/9.0=87, 8.1~8.4=69, 6.2~7.1=45. WSS 권장 | 구형 OS는 ES2015+ 번들 주의 |
| Broadsign Control | HTML5 + Player API(2324 XML / 2326 JSON over WebSocket) | 재생 증명(POP)·데이터 캡처 양방향 |
| Xibo(오픈소스 AGPL) | Webpage/Embedded/HTML Package 위젯, XMR(WS) 실시간 명령, 플레이어 로컬 :9696 | 자체 호스팅 가능 |
| Yodeck | Web App/Web Page. 기본 WebKit(프라이빗 모드), 대안 Chromium(투명 불가) | RPi급 CPU 가정 |
| Signagelive | Widget SDK(`signagelive.js`) | — |
| 국내 DID | Android 셋톱 다수(예: neosign) [C], 공통 규격 없음 | **Android WebView 키오스크 앱 + URL**로 대응, 운영사별 사전 테스트 |

### 2.2 LED 프로세서 외부 입력 (ARCH-02)
NovaStar H 시리즈: HDMI 1.3~2.1, DP 1.1~1.4, DVI, 3G/12G-SDI, **NDI, ST2110** 입력 카드, TCP/IP·RS232 제어 [A]. Brompton 사양 [미확인]. 운영사 외부입력 정책은 공개 문서 없음 [미확인] → 실무: 운영사 입회, 고정 EDID(1080p60/4K30), HDCP 없는 소스, 입력 전환은 운영사 콘솔.

### 2.3 미디어서버별 웹 렌더·데이터 수신 (ARCH-03) [A, 문서 검증]
| 서버 | 웹페이지 렌더 | WS/OSC/REST 수신 |
|---|---|---|
| **TouchDesigner** | Web Render TOP(CEF 별도 프로세스, HTML5/PDF/SVG). 팔레트 `webBrowser`는 "as-is, no support", Windows 전용 | WebSocket DAT(클라이언트), **Web Server DAT**(HTTP+WS 서버, TLS), OSC In DAT |
| **Resolume Arena** | 브라우저 소스 **없음**. 입력은 NDI(알파)·Spout/Syphon·캡처 | REST API+Webserver(v7.8), WebSocket API `ws://host:port/api/v1`, OSC |
| **Pixera** | 브라우저 소스 [미확인] | JSON-RPC 2.0 over TCP/UDP/HTTP POST, HTTP 서버가 HTML도 서빙 |
| **disguise Designer** | Web layer(Chromium, **소프트웨어 렌더러**, 투명 배경, JS 명령) | NDI, RenderStream(UE/Unity/Notch/TD), OSC·OscControl, Live Update WebSocket API |
| **Ventuz** | Web Browser 노드(CEF, 최대 16384², 터치 16점, JS 상호호출, **첫 GPU만**, 팝업 불가) | 일반 데이터 노드 |
| **Notch** | 브라우저 노드 [미확인] | Web/HTTP API `GET /control?uid=&value=`, Web GUI(:8910), OSC, NDI |
| **Unreal** | 자체 렌더. Pixel Streaming 2(5.4+, WebRTC) | Remote Control API(HTTP+WS :30020, Beta) |
| **Unity** | Vuplex 3D WebView(Chromium 137, $129.99~229.99/플랫폼) | 일반 .NET WS |

## 3. 실시간 백엔드 옵션 (ARCH-10) [A, 가격 페이지 확인 2026-10-01]
| 옵션 | 스케일 모델 | 공개 한도 | 운영 부담 | 한국 |
|---|---|---|---|---|
| Socket.IO + Redis adapter | Redis Pub/Sub 포워딩, **스티키 세션 필수** | 노드당 OS 의존(ulimit, 임시포트 ~28k→55k) | 자체(중) | AWS Seoul |
| Colyseus | 룸=단일 프로세스, Redis presence | 1vCPU/1GB ≈ 1~2k 동접(단순 게임) | 자체(중)/Cloud | 임의 |
| Nakama | Go 클러스터 | 벤치 1코어 ≈ 20,277 CCU | 자체(중~상, DB) / Heroic Cloud Asia("from $600/mo" [C]) | GCP/AWS Asia |
| Ably | 완전관리, 7 코어 DC(싱가포르)+635 엣지(서울 8) | Free 200 / Standard 10k / Pro 50k 동접 | 최저 | 코어는 싱가포르 |
| PubNub | MAU 과금 | Free 200 MAU, Starter $98/1,000 MAU | 최저 | PoP [미확인] |
| Pusher | 고정 티어 | Pro 2k / Premium 10k / Growth 15k / Growth Plus 30k | 최저 | 도쿄·싱가포르(서울 없음) |
| **Cloudflare Workers + Durable Objects** | DO=룸(단일 스레드 액터), WS Hibernation(유휴 미과금), 수신 메시지 20:1 과금, 송신 무료 | DO당 처리량 공식 수치 없음 [미확인] → 계층 샤딩 | 낮음 | 서울 PoP, 힌트 `apac-ne` |
| **Supabase Realtime** | Phoenix 기반 관리형 | Free 200 / Pro 500(캡 해제 10k) / Team 10k 동접, joins/s 100/500/2,500 | 낮음 | **ap-northeast-2 서울** |
| Firebase RTDB | 관리형 | DB당 200k 동접, 1,000 writes/s(소프트) | 낮음 | 리전 제한 [미확인] |
| LiveKit(WebRTC data) | SFU | Build 무료 100 / Ship $50 1k / Scale $500 5k 동접 | 낮음 | 리전 [미확인] |
| Phoenix Channels 자체 | BEAM | 단일 40코어 서버 2M 접속(2015) | 자체(중, 인력 희소) | 임의 |

### 3.1 2시간 이벤트 비용 (동접 N, 폰→서버 0.1msg/s, 서버→폰 0.2msg/s)
| 백엔드 | N=1k | N=10k | N=100k |
|---|---|---|---|
| Ably | ≈$35 | ≈$84(상한 정확히)→Pro ≈$455 | Enterprise(사용분 ≈$552) |
| Pusher | Pro $99 | Growth $699 | Enterprise |
| Supabase | ≈$30 | ≈$187(단 msg/s 한도 협의) | 불가(Enterprise) |
| **Cloudflare DO** | ≈$5 | ≈$5 | ≈$6(100 DO 샤딩+집계 DO 설계) |
| Firebase RTDB | ≈$0 | ≈$3(writes/s 한도) | ≈$29(샤딩 필수) |
| 자체 Colyseus/Socket.IO(AWS Seoul) | ≈$1 | ≈$2~3 | ≈$20~30+LB |
**해석**: 상시 10~100 스크린은 DO 또는 Supabase 서울로 월 수십 달러. 대형 이벤트는 자체 호스팅이 압도적으로 싸지만 부하테스트·당일 인력이 비용을 지배.

## 4. 대규모 참여 아키텍처 사례 (ARCH-20)
| 사례 | 수치 | 핵심 | 출처 |
|---|---|---|---|
| r/place 2017 | 1.1M 유저, **150k 동접**, 16.5M 타일/72h, 180k writes/s 부하테스트, 보드 1M픽셀=4bit=**500KB** | Redis **BITFIELD** 원자 쓰기, Cassandra 이력, 보드 전체는 **CDN max-age=1s**, WS 클러스터+RabbitMQ 팬아웃, 쿨다운 튜너블+킬스위치 | Fastly 블로그 2017 [A], arXiv 2408.13236 [A] |
| r/place 2022 / 2023 | 149.6M / 122.7M 업데이트 | 스냅샷+델타 유지, 캔버스 확장 시 룸 분할 | arXiv [A] |
| Twitch Plays Pokémon | 1.16M 참여, 121k 피크 동시 | Anarchy(순차) ↔ **Democracy(30s 창 다수결)** | Wikipedia [C], arXiv 1408.4925 [A] |
| Jackbox | 플레이어 8~10, **관객 10,000** | 4글자 룸코드, 폰=컨트롤러, 관객은 투표/영향만 | Jackbox [A] |
| AirConsole | — | 롱폴링→WS→**WebRTC DataChannel** 계층 폴백, NAT 제약 ~14%는 서버 경유, **JS NTP 모사**로 버튼 시각 복원 | AirConsole Latency 자료 [A] |
| Kahoot! | 플랜별 50~5,000 참가자 | 세션 PIN | [A] |
| Mentimeter | **0→70,000+ 동접 수초 내**(이전 벤더 ~35k 붕괴) | Ably로 이전 | Ably 사례 [A·벤더] |
| Monterosa | EA SPORTS 30M+ 투표 | 분당 피크 비공개 [미확인] | [A·벤더] |

재사용 패턴(ARCH-21):
```
폰 N대 ─(입력, 사용자별 토큰버킷)─► Redis ─┬ 투표: INCR/HINCRBY → 비율
                                          ├ 크라우드 평균: SUM/COUNT(좌표·기울기) → 커서 1개
                                          ├ 다수결: tick(0.5~30s)마다 argmax
                                          └ 캔버스: BITFIELD(4bit/픽셀) → 스냅샷 PNG(CDN 1s) + 델타(WS)
스크린 ◄─(tick마다 집계 상태 1개)─ 서버    ※ 폰은 "내 입력 반영됨" ACK만
```
- 관객 vs 플레이어 분리(Jackbox): 게임은 소수, 다수는 투표/응원 채널 → 지연·공정성 회피.
- 룸 샤딩+계층 집계: 스크린당 룸(≤2~5k)→상위 집계 룸.

## 5. 지연·동기화 (ARCH-30)
```
폰 입력 → 무선(5G/LTE/Wi-Fi) 20~60ms[추정] → 서버 1~10ms → 스크린 WS 10~60ms → 렌더 16~33ms → 프로세서/패널 1~3프레임[미확인]
합계 ≈ 100~250ms (단일 홉, 서울 리전)
```
- 한국 이동통신 지연 1차 자료(Opensignal/Ookla) 접근 실패 [미확인]. Ably 글로벌 평균 <65ms [A].

| 포맷 | 허용 지연 | 설계 |
|---|---|---|
| 투표/설문/메시지 월 | 0.5~2s | 폰 ACK만, 스크린 1Hz 집계 |
| 협업 드로잉/픽셀 | 200~500ms | 로컬 즉시 그리기(낙관적)+서버 확정 재적용 |
| 크라우드 조종(평균 커서) | 150~300ms | 100ms tick 이동평균, 스크린 보간 |
| 리듬/반응속도 게임 | <100ms | **스크린 측 판정 금지**: 폰에서 동기 클럭으로 판정 후 결과만 전송, 또는 클라이언트 예측+서버 조정 |
| 라이트/레이저 큐 | 수십 ms | 절대 시각 스케줄 |

클럭 동기(ARCH-31): NTP 유사 교환 5~10회(지연 최소/중앙값) → 오프셋. `timesync` 라이브러리는 2025-07 아카이브 → 자체 50줄 구현. 큐는 `t0 = server_now + 1.5s` 절대시각으로 발행. disguise QTP 7542/7543·VSync 7968.
조인 버스트(ARCH-32, 콘서트 순간 1,000명): 정적 PWA는 CDN 선로드, 접속 지터 백오프(Full Jitter로 서버 호출 >50% 감소 [A AWS]), WS 실패 시 HTTP POST 폴백, 룸 사전 워밍(스크린이 먼저 접속), 대기실 UI. Supabase joins 500/s, Ably Standard 2.5k msg/s 한도 참고.

## 6. QR·조인 UX 기술 (ARCH-40)
- **URL/토큰**: `https://brand.kr/s/<screen>/<slot>?t=<jwt>` 슬롯별 서명 토큰(만료 10~30분) → 리플레이·원격참여 차단 + 어트리뷰션 키. 브랜드 단축 도메인은 신뢰 신호이자 분석 키.
- **네이티브 즉시실행**: **Android Instant Apps 2025-12 종료**(Google Play 게시 불가 [A]) → iOS App Clips만 남음 → **PWA 일원화**가 합리적. App Clip은 카메라 AR·NFC 필수일 때만. PWA 설치 유도는 금지(마찰).
- **QR 가독성(LED)** [A DENSO WAVE]: 쿼이트존 4모듈, 모듈 "4도트 이상", 오류정정 M(15%) 일반·더러운 환경 Q/H. LED 적용: **1모듈=정수 LED 픽셀(권장 2~3px)**로 모아레 방지, URL 단축으로 **v2(25모듈)~v3(29모듈)** 유지. 예) 피치 10mm, v2+쿼이트존 33모듈×3px=99px ≈ **0.99m** 폭 ≈ 10m 스캔 가정. "QR 폭 ≈ 거리/10" 규칙은 업계 통용치 [미확인]. 반전 QR·움직이는 QR·저대비·곡면 매핑 금지, **정지 프레임 3초 이상**. 폴백: 4~6자 룸코드+짧은 URL 텍스트 병기.
- **대안**: CUE 데이터-오버-오디오(초음파)는 트리거/동기 큐엔 적합, 양방향 입력엔 부적합 [A·벤더]. NFC/BLE는 대형 스크린 거리에서 무의미.
- **안티-퀴싱**(FTC 2023-12 [A]): 스크린에 도메인 텍스트·HTTPS·리다이렉트 1홉 이하, 랜딩 첫 화면에 운영사/브랜드와 스크린 이름.
- **봇/남용**: Cloudflare Turnstile(무료 20위젯 [A]) + 서버 토큰버킷 + 토큰 만료. 로그인 없는 신원은 서명 세션 ID(쿠키/localStorage), 핑거프린트는 보조(FingerprintJS OSS 정확도 "significantly lower" [A]).
- 연령 게이트: 자기신고 + 등급별 모더레이션 강화. 법적 요건 → `06-risks-legal.md`.

## 7. 모더레이션 스택 (ARCH-50)
```
입력 → 포맷 제약(길이·문자셋·스탬프/팔레트) → 사전 필터(한국어 금칙어·정규식·URL/전화 차단)
  → ML API(텍스트: OpenAI omni-moderation(무료)/Hive, 이미지·드로잉: Rekognition·Vision SafeSearch·Hive·nsfwjs)
  → 점수화·자동 승인/차단 → [30~90s 버퍼] 사람 승인 큐(단축키·일괄) → 게시 → 감사로그·보존·삭제
```
| 서비스 | 지원 | 비용 | 한국어 | 출처 |
|---|---|---|---|---|
| OpenAI `omni-moderation-latest` | 텍스트+이미지, 13 카테고리 | **무료** | 다국어 개선 발표(2024-09) [미확인] | [A] |
| Google Perspective | TOXICITY 등 | 무료(쿼터) | [미확인] | — |
| Hive | Visual $3.00/1k, Text $0.50/1k, 기본 100 req/일 | 좌 | [미확인] | [A] |
| AWS Rekognition Moderation | 이미지 | $1.00/1k(첫 1M) | — | [A] |
| Google Vision SafeSearch | 이미지 | $1.50/1k | — | [A] |
| Naver CLOVA GreenEye / Kakao | 페이지 404 [미확인] | — | — | — |
| 한국어 오픈 데이터 | UnSmile 18,742문장(CC-BY-NC-ND, 상용 문의), KoCoHub 9,381(CC-BY-SA), Curse-detection 5,825(MIT), korean-bad-words(MIT) | 무료 | ○ | [A GitHub] |
| 드로잉 | nsfwjs(9.0k★, 브라우저 추론) — 사진 기반이라 **낙서 성기 그림 등 미검출 가능성** [미확인] | 무료 | — | [A] |

실무 지침 5: ① 공공 스크린은 **사전 승인만**. 자동 승인은 스탬프/이모지/선택지처럼 입력 공간이 닫힌 포맷에 한정 ② 자유 드로잉은 템플릿 제약(색칠·스텐실·대칭 브러시·시간 제한)+사람 승인 ③ 텍스트는 금칙어→ML→사람 3단, 자모 분리·숫자 치환 정규화 ④ 승인 UI 30~90s 버퍼, 단축키, 즉시 회수(kill) ⑤ 감사로그 1년, 원본 UGC 종료 후 30일 내 삭제, 개인정보 비수집 원칙.

## 8. 분석·어트리뷰션 연동 (ARCH-60)
- QR 벤더 가격 [A]: Flowcode Pro Plus $25/월(연납, 50코드·6k스캔·도메인 5), Growth $250/년~. Bitly Growth $29(도메인 1), Premium $199. Uniqode Core $49/월, 커스텀 도메인 $2,000/년. QR Tiger 404 [미확인].
- **자체 구현 권장**: QR 토큰이 곧 분석 키 → 스캔→랜딩→참여→완료 퍼널을 자체 로그(스크린·슬롯·시간대·고유 세션)로 집계. 벤더는 브랜드 도메인 관리 용도만.
- pDOOH 신호: Vistar(DSP+SSP), Place Exchange PerView, Broadsign Reach("Place Exchange by Broadsign" 표기, 55+ DSP), VIOOH(JCDecaux, 50+ DSP), Hivestack→**Perion**(>1.7M 스크린) [A]. 이들 SSP는 QR 참여를 표준 지표로 받지 않음 [미확인] → 우리 플랫폼이 **스크린·슬롯별 참여수/고유참여/세션 길이/완료율**을 리포트 API·CSV로 내보내고, 운영사가 pDOOH 딜의 부가 KPI(engagement rate)로 패키징.
- 노출 측정 센서: Quividi(월 2Bn 임프레션, Broadsign/Vistar/PX 연동), AdMobilize [A·벤더] → 리프트 측정 = 인터랙션 슬롯 vs 일반 슬롯의 주목·체류 비교.

## 9. WebAR·카메라 (ARCH-70)
| 플랫폼 | 2025~26 상태 [A] |
|---|---|
| 8th Wall / Niantic | **유료 플랜·호스팅 플랫폼 2026-02-28 종료**, XR Engine 바이너리 무료 배포, 셀프 호스팅, 오픈소스 유틸(MIT) |
| Zappar/Zapworks | Developer $12.99/월(비상업), **Pro $315/월**(12k views/년), Enterprise 화이트라벨 |
| Snap Camera Kit | iOS/Android/Web, 가격 비공개 |
| TikTok Effect House | 앱 내 전용 |
판단: AR이 가치 있는 경우는 ① 스크린 자체를 이미지 타깃으로 쓰는 "스크린 확장" ② 셀피 필터→스크린 게시. 카메라 권한·배터리·전환율 마찰 때문에 **기본 포맷은 non-AR**, AR은 캠페인 옵션.

## 10. 오픈소스 레퍼런스 (ARCH-80, ★ 확인 2026-10-01)
| 범주 | 레포 |
|---|---|
| 실시간 | socket.io 63.2k · colyseus 7.3k(MIT) · nakama 13.5k(Apache-2) · livekit 21.2k · phoenix 23.2k · supabase/realtime 7.6k · uWebSockets.js 9.2k |
| 엣지 룸 | partykit 5.7k(cloudflare/partykit로 이동) · cloudflare/workers-chat-demo 1.1k(DO+WS Hibernation) |
| 저지연 UDP | geckos.io 1.5k(WebRTC DataChannel) |
| 폰 컨트롤러 | AirConsole/airconsole-api 109 · colyseus-examples 198 |
| 픽셀 캔버스 | pxlsspace/Pxls 259(Java/Postgres/WS, MIT) |
| TouchDesigner | DBraun/TouchDesigner_Shared 1.0k + 공식 Web Server DAT |
| Resolume | bitfocus/companion-module-resolume-arena 28 |
| Pixera | Tedcharlesbrown/Pixera-TCB 10 |
| disguise | disguise-one/RenderStream-UE 81 · vue-liveupdate 4 |
| OSC 브리지 | adzialocha/**osc-js** 283(UDP·WS·브리지 모드) · MylesBorins/**node-osc** 458 |
| 모더레이션 | nsfwjs 9.0k · nsfw_model 2.1k · 한국어 데이터 4종 |
| 사이니지 | xiboplayer/xiboplayer(AGPL, PWA/Electron 플레이어 SDK) |
| 보조 | timesync(아카이브) · fingerprintjs 28.5k |

## 11. 비용·공수 추정 (ARCH-90) — 서울 리전, 인건비 제외
| 시나리오 | 트래픽 가정 | 인프라 월비용 | 구성 |
|---|---|---|---|
| (i) 10 스크린 상시 라이트 인터랙션 | 스크린당 평균 5·피크 50 동접, 월 ~52M 메시지, UGC 1k/일/스크린 | **$100~400** | DO $5~15 또는 Supabase Pro $25+ 또는 Ably ≈$160; DB $25~60; 모더레이션 OpenAI 무료+이미지 $10~30 |
| (ii) 3시간 이벤트, 참여 20k(피크 ~15k) | 평균 8k 동접×180분, 26M 메시지, 텍스트 60k·드로잉 20k | **$100~900/회** | 자체 2×8vCPU+Redis ≈$20 / Ably Pro ≈$470 / DO ≈$10; 모더레이션 인력 2~3명×4h 별도; 리허설·부하테스트 1일 별도 |
| (iii) 100 스크린 SaaS | 스크린당 평균 10 동접 24/7, 월 ~1.0B 메시지, UGC 3M/월 | **$500~1,500(자체) / $1,500~4,000(관리형)** | → **스크린당 $5~40/월** → 판가 ₩5~15만/스크린/월 가능(H:) |

**MVP 공수**(투표+드로잉+메시지월+미니게임 1종+CMS+모더레이션): **10~12 인월**(3인 ≈ 4개월, 범위 8~14). 실시간 코어 1.5 · 폰 PWA 4포맷 2.0 · 스크린 렌더러(HTML5+TD/NDI/OSC 브리지) 1.5 · CMS/운영 2.5 · 모더레이션 1.0 · QA/부하/보안/실기 1.5 · 디자인 1.0. 최대 변동 요인: **사이니지 인증서/파트너 승인 리드타임**과 운영사별 현장 테스트(각 1~3주).

## 12. 함정·실패 포인트 (ARCH-95)
| 영역 | 함정 | 대책 |
|---|---|---|
| iOS Safari | iOS 15.0~15.3 백그라운드 후 WS 재접속 불가 버그(15.4 수정) [A WebKit]; suspend 시 OS가 소켓 조용히 끊음 [A Apple DTS] | `visibilitychange`/`pageshow`에서 프로브 후 즉시 재접속, 서버 세션 복구 |
| 통신사 NAT | RFC 5382는 TCP 유휴 2h4m 이상이지만 실측 73개 통신사 중 11개 <10분, 1개 255초 RST [A SIGCOMM'11] | 앱 keepalive ≤4분(권장 25~45s) |
| 캡티브 포털 | DNS/HTTP 변조형 포털이 비브라우저 앱 파괴 [A RFC 8952] | 경기장 Wi-Fi 의존 금지(LTE 기본), HTTPS 정적 페이지로 포털 감지 |
| 배터리/백그라운드 | 세션 유실, 라이트쇼는 화면 켜짐 필요 | Wake Lock API, 짧은 세션 |
| 플레이어 엔진 편차 | Chromium 45~120, WebKit, 투명 불가, 파트너 인증서 | ES2017 타깃, 기능 감지, 2D Canvas 중심 |
| 미디어서버 웹레이어 | TD "as-is", disguise 소프트웨어 렌더, Ventuz 첫 GPU만, Resolume 브라우저 없음 | UI는 NDI/Spout 보조 렌더, 서버엔 숫자만 |
| EDID/HDCP | 공개 자료 부재 [미확인] | 고정 EDID 에뮬레이터, HDCP 없는 소스, 리허설 |
| 폰트/이모지 | Tizen/webOS 컬러 이모지·한글 커버리지 [미확인] | 웹폰트 서브셋 자체 호스팅, 이모지는 SVG 스프라이트 |
| 캐싱 | 플레이어 CMS가 URL 캐시 | 해시 파일명, HTML `no-store`, 버전 핸드셰이크 |
| 시간 | 플레이어 시계 오차(TLS 실패) | 서버 오프셋 스케줄 |
| 스케일 | 단일 룸 과부하, 스티키 세션 누락(HTTP 400) | 스크린당 룸+계층 집계 |
| 보안/남용 | 퀴싱 스티커, 봇 투표 | 도메인 노출, Turnstile, 토큰 만료, 쿨다운, 중앙값 집계 |

## 13. 추가조사 필요 (트랙 C 이월)
1. 한국 모바일 지연 실측(ms) — 자체 측정(서울 5G/LTE/공공 Wi-Fi → Seoul 리전 WS RTT).
2. 사이니지 플레이어별 브라우저 엔진 버전·Canvas/WebGL 성능 실기 벤치. Tizen 8 URL Launcher 변화 재확인.
3. 국내 매체 운영사(옥외·몰·경기장·지하철 DID)의 외부 입력·웹앱 설치 정책 인터뷰. ← Q-10
4. Cloudflare DO 룸당 실질 처리량 부하 테스트.
5. 한국어 텍스트 모더레이션: Perspective 한국어·Comprehend toxicity·Naver/Kakao API 현황. OpenAI 무료 + 한국어 데이터셋 파인튜닝 소형 모델 벤치.
6. 드로잉(낙서·선화) 모더레이션 성능 — 자체 데이터셋.
7. App Clips 한도·QR 10:1 규칙 1차 출처·Brompton 입력 사양.
8. pDOOH SSP의 외부 engagement 신호 수용 경로(Vistar/PX/VIOOH 세일즈 확인).
