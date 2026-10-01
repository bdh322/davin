# C. 기술 워크플로 조사 — 대형 공공 스크린 × 스마트폰 웹 실시간 인터랙션 플랫폼

작성일 2026-10-01 · 대상: 미디어아트 TD(미디어서버·TouchDesigner·레이저·CMS)
출처 등급: **A** 공식 문서/논문/당사 엔지니어링 블로그/GitHub · **B** 전문 매체/전문가 자료 · **C** 포럼/블로그 · **[미확인]** 1차 자료로 검증 못 함
표기 규칙: `[등급 | URL | 날짜]` — 날짜는 문서 발행일, 없으면 "확인 2026-10-01".

> 조사 범위 메모: 공식 문서 ~90건 fetch, 웹검색 ~45건. Reddit 공식 블로그·Opensignal·Ookla·Apple 개발자 문서·Perspective API 문서는 봇 차단/JS 렌더링으로 1차 확인 실패 → 해당 수치는 2차 출처 또는 [미확인]으로 표기.

---

## 1. 레퍼런스 아키텍처

### 1.1 전체 흐름

```
 [LED/미디어파사드/몰 스크린]  ← 화면에 QR + 짧은 URL + 룸코드 노출 (슬롯별 토큰)
          ▲
          │ (렌더 경로 a/b/c 중 택1)
          │
 ┌────────┴─────────┐     WebSocket(상태 델타)       ┌──────────────────────────┐
 │ Screen Renderer   │◄───────────────────────────────│ Realtime Core             │
 │ (HTML5 on player │     + 스냅샷 URL(CDN, TTL 1s)    │  rooms = screen_id:slot   │
 │  / 렌더박스 / TD) │                                 │  tick 10~30Hz, 집계·레이트리밋│
 └──────────────────┘                                 │  Redis(bitfield/INCR/pubsub)│
                                                      └────────▲──────┬──────────┘
      HTTPS(CDN) 정적 PWA  ┌───────────────┐  WS/HTTP(fallback)│      │ 큐
 [폰 브라우저] ───────────►│ Edge/CDN+WAF  │───────────────────┘      ▼
  QR→https://brand.kr/s/<screen>/<slot>?t=<jwt>   Turnstile        ┌──────────────┐
                           └───────────────┘                        │ Moderation    │
                                                                    │ auto(API)→큐→ │
                                                                    │ 사람 승인(30~90s)│
                                                                    └──────┬───────┘
                                                                           ▼
                                                     [CMS/운영콘솔: 스크린 레지스트리, 스케줄, QR 발급, 모더레이션 큐, 분석]
```

핵심 설계 원칙 (사례에서 추출, §3): ① **스크린 1개 = 룸 1개**(샤딩 단위) ② 폰→서버는 "입력", 서버→스크린은 "집계된 상태"만 ③ 스냅샷(CDN) + 델타(WS) ④ 사용자별 레이트리밋/쿨다운 ⑤ 스크린은 항상 마스터 클럭.

### 1.2 렌더/출력 경로 3종 비교

| 경로 | 구성 | 장점 | 단점/리스크 | 비용(스크린당) |
|---|---|---|---|---|
| **(a) 플레이어 내장 HTML5** | 사이니지 플레이어(Tizen/webOS/BrightSign/Broadsign/Xibo/Yodeck…)의 브라우저가 우리 웹앱 URL을 직접 실행, WS로 상태 수신 | 추가 하드웨어 0, 원격 배포, 다수 스크린 확장에 최적 | 엔진 버전·GPU 성능 편차 큼(Chromium 45~120 혼재, §11), 운영사 CMS 정책·인증서(파트너 서명) 장벽, WebGL/폰트/이모지 제약 | 0원(소프트웨어만) |
| **(b) 전용 렌더 박스** | TD/Unreal/Unity/Chromium 키오스크 PC → HDMI/SDI/NDI → LED 프로세서 외부 입력 | 렌더 품질·프레임 보장, 미디어서버 워크플로 그대로, 실시간 효과 자유 | 운영사 "외부 입력" 승인·현장 상주·EDID/HDCP 이슈 [운영사 정책 미확인], 박스당 CAPEX·현장 네트워크 | PC ₩100~300만 + 캡처/컨버터 |
| **(c) 기존 미디어서버 통합** | 운영사/공연의 TD·Resolume·Pixera·disguise·Ventuz·Notch·Unreal에 레이어/파라미터로 주입 | 기존 쇼 컨트롤·타임라인·맵핑 재사용, 공연/이벤트에 최적 | 서버별 API·웹 레이어 품질 상이, 벤더 종속, 운영자 협업 필수 | 라이선스는 기존 자산, 통합 공수 |

판매 전략상 **(a)를 기본 제품**, (b)는 "이벤트 키트", (c)는 "공연/미디어파사드 통합 옵션"으로 묶는 것이 합리적.

### 1.3 (a) 사이니지 플레이어별 웹 실행 확인

| 플레이어 | 웹 실행 방식 (확인) | 비고 |
|---|---|---|
| Samsung Tizen SSSP | Home→**URL Launcher**에 URL 입력, 또는 `sssp_config.xml`+서명된 `.wgt` 커스텀앱. MagicINFO는 "거의 모든 웹 표준 콘텐츠" 재생 주장 `[A | samsung.com/sec/business/display-solutions/magicinfo | 확인 2026-10-01]`; VXT Player는 Tizen 6.5+ `[A | samsung.com/sec/business/display/vxt-solution | 확인 2026-10-01]`; URL Launcher 절차 `[B | docs.signageos.io …/samsung-tizen-device-provisioning | 확인 2026-10-01]` | Tizen 8.0에서 `<type>url</type>` 설정 무시·**삼성 파트너 인증서** 없으면 설치 실패(“Error -3”), Tizen Studio GUI 대신 CLI 권장 `[C | gist.github.com/aweussom/28c7e9f0… | 확인 2026-10-01]`. 모델별 Chromium 버전 [미확인] |
| LG webOS Signage | SI Server 설정(FQDN ON, Application Launch Mode Local, Type IPK)으로 IPK 자동 설치; 개발자 포털은 LG 승인 파트너 전용, SCAP/IDCAP API 제공 `[A | webossignage.developer.lge.com | 확인 2026-10-01]` `[B | docs.signageos.io …/lg-webos-device-provisioning]` | 파트너 승인 리드타임 고려 |
| BrightSign | HTML5 Chromium 엔진. **Chromium 120 = BrightSignOS 9.1.x**, 87 = 8.5/9.0, 69 = 8.1~8.4, 45 = 6.2~7.1 `[A | docs.brightsign.biz/releases/chromium-downloads | 확인 2026-10-01]`; WebSocket 지원·WSS 권장(문서 `docs.brightsign.biz/advanced/websockets`는 fetch 시 404 → 검색 요약 기준 [미확인]) | OS 버전=브라우저 버전. 구형 OS는 ES2015+ 번들 주의 |
| Broadsign Control | HTML5 콘텐츠 재생 + **Player API**: 포트 2324(XML)/2326(**JSON over WebSocket**), Remote Control 활성화 필요 `[A | docs.broadsign.com …/broadsign-control-player-api.html | 확인 2026-10-01]` | 재생 증명(POP)·데이터 캡처 액션으로 CMS와 양방향 |
| Xibo | Webpage/Embedded/HTML Package 위젯으로 HTML·CSS·JS 실행; XMR(WebSocket) 실시간 명령; v4.1 Data Connector; 플레이어 로컬 웹서버 :9696 `[A | xibosignage.com/docs/developer/widgets/embedded, docs.xibosignage.com/developer/player-control/player-info | 확인 2026-10-01]` | 오픈소스(AGPL), 자체 호스팅 가능 |
| Yodeck | HTML5/JS **Web App**·Web Page; 기본 WebKit(프라이빗 모드), 대안 Chromium(투명 불가); RPi4/5·Android·Tizen·webOS·BrightSign 지원 `[A | yodeck.com/docs/user-manual/build-a-web-widget | 확인 2026-10-01]` | RPi급 CPU 가정 필요 |
| Signagelive | Widget SDK(`signagelive.js`), Samsung/LG/BrightSign/ChromeOS 등 `[A | build.signagelive.com/widget-sdk | 확인 2026-10-01]` | |
| Scala | 2013년부터 HTML5 재생 `[B | digitalsignagetoday.com …scala-featuring-html5… | 2013]` | 최신 엔진 [미확인] |
| 국내 DID | Android 셋톱 기반 제품이 다수(예: neosign) `[C | neosign.co.kr/large | 확인 2026-10-01]`; 공통 규격 없음 → **Android WebView(Chromium) 키오스크 앱 + URL** 로 대응 | 운영사별 사전 테스트 필수 [미확인] |

### 1.4 (b) 외부 입력 — LED 프로세서

NovaStar H 시리즈(H2~H20)는 HDMI 1.3/1.4/2.0/2.1, DP 1.1/1.2/1.4, DVI, 3G/12G-SDI, **NDI, ST2110** 입력 카드와 TCP/IP·RS232 제어, 권한 관리 지원 `[A | novastar.tech/product/detail.html?catid=3&id=39 | 확인 2026-10-01]`. Brompton Tessera 사양 페이지는 fetch 실패 [미확인]. 미디어 운영사의 외부 입력 허용 정책은 공개 문서가 없음 [미확인] — 실무상 ① 운영사 인력 입회 ② 고정 EDID(1080p60/4K30) ③ HDCP 비활성 소스 ④ 입력 전환은 운영사 콘솔에서 수행이 일반적(필드 경험, 근거 문서 없음).

### 1.5 (c) 미디어서버별 웹 렌더 / 데이터 수신 가능 여부 (문서 검증)

| 서버 | 웹페이지 렌더 | WebSocket/OSC/REST 수신 | 출처 |
|---|---|---|---|
| **TouchDesigner** | **Web Render TOP**: CEF(Chromium) 별도 프로세스, 공유메모리로 텍스처 반환, HTML5/PDF/SVG. 팔레트 `webBrowser`는 "**as-is, no support**… Chromium 기능 다수 미동작" 명시, Windows 전용 | **WebSocket DAT**(클라이언트, ws/wss, 기본 100행 FIFO), **Web Server DAT**(HTTP+WebSocket 서버, TLS, Basic 인증, POCO 1.13.3), **OSC In DAT**(UDP, 번들, 콜백) | `[A | docs.derivative.ca/Web_Render_TOP, /Palette:webBrowser, /WebSocket_DAT, /Web_Server_DAT, /OSC_In_DAT | 확인 2026-10-01]` |
| **Resolume Arena** | 브라우저 소스 **없음**(지원 색인에 부재). 입력은 NDI(알파 포함)·Spout/Syphon·캡처 | **REST API + Webserver**(v7.8 문서), **WebSocket API** `ws://host:port/api/v1` 로 파라미터 subscribe/set/trigger, OSC | `[A | resolume.com/support/en/restapi, /websocket-api, /ndi | 확인 2026-10-01]` |
| **Pixera** | 브라우저 소스 [미확인] | **JSON-RPC 2.0** over TCP(`pxr1`+4바이트 헤더 또는 0xPX 구분자)/UDP/HTTP POST, HTTP 서버가 HTML/CSS 파일도 서빙 | `[A | help.pixera.one/api-quick-start-guide, pixera.one …pixera_api_documentation_5.pdf | 확인 2026-10-01]` |
| **disguise Designer** | **Web layer**: Chromium 기반, **소프트웨어 렌더러**(GPU는 Designer가 독점), 샌드박스 프로세스, 투명 배경, JS 명령 전송, 타임라인 float 5개·클럭 전달 | NDI 입력, **RenderStream**(UE/Unity/Notch/TD), OSC 입력·OscControl 레이어, Live Update WebSocket API(`vue-liveupdate`), QTP 7542/7543·VSync 7968 | `[A | help.disguise.one …/web-layer, /renderstream-layer, /osccontrol, /network-ports-and-activity; github.com/disguise-one | 확인 2026-10-01]` |
| **Ventuz** | **Web Browser 노드**: CEF, 텍스처 렌더(최대 16384², 8K 초과 비권장), 키/마우스/터치 16점, JS 상호호출, **첫 번째 GPU에서만** 동작, 팝업 미지원 | (일반 Ventuz 데이터 노드) | `[A | ventuz.com/support/help/latest/NodeInteractionTouchWebBrowser.html | 확인 2026-10-01]` |
| **Notch** | 브라우저 노드 [미확인/문서 미발견] | Web/HTTP API `GET /control?uid=&value=`(Exposed Properties), Web GUI(:8910), OSC Modifier/Output, NDI Source | `[A | manual.notch.one/0.9.21/en/topic/web-api; manual.notch.one/2026.1 … | 확인 2026-10-01]` |
| **Unreal** | 자체가 렌더러. **Pixel Streaming 2**(5.4+): WebRTC, 시그널링 :80/:8888, 브라우저 입력 전달 | **Remote Control API**: HTTP + WebSocket(기본 :30020), Beta("use caution when shipping") | `[A | dev.epicgames.com …getting-started-with-pixel-streaming…, …remote-control-api-websocket-reference… | 확인 2026-10-01]` |
| **Unity** | 3rd-party **Vuplex 3D WebView**: Windows/macOS Chromium 137, 텍스처 렌더, C#↔JS 메시지, 플랫폼당 $129.99~229.99 | WebSocket 등은 일반 .NET | `[A | developer.vuplex.com/webview/overview, store.vuplex.com | 확인 2026-10-01]` |

실무 권장: (c)에서 **웹 레이어로 전체 UI를 렌더하지 말고**, 미디어서버에는 OSC/WebSocket/JSON-RPC로 "집계값(투표 비율, 평균 좌표, 트리거)"만 넣고, 텍스트/그림 같은 UGC는 Spout/NDI로 보조 렌더(TD/Chromium)를 합성하는 하이브리드가 안정적.

---

## 2. 실시간 백엔드 옵션 비교

### 2.1 특성 비교

| 옵션 | 스케일 모델 | 공개 한도 | 운영 부담 | 한국 리전/PoP |
|---|---|---|---|---|
| **Socket.IO + Redis adapter** | 노드 간 Redis Pub/Sub 포워딩, **스티키 세션 필수**(없으면 HTTP 400), Redis 다운 시 로컬 전달만; Connection State Recovery는 Redis adapter 미지원(Streams adapter 지원) `[A | socket.io/docs/v4/redis-adapter, /connection-state-recovery | 확인 2026-10-01]` | 노드당 한도는 OS 의존: ulimit 기본 1024, 임시포트 기본 ~28k/IP→튜닝 55k `[A | socket.io/docs/v4/performance-tuning]` | 자체 호스팅(중) | AWS Seoul 등 임의 |
| **Colyseus** | 룸=단일 프로세스, 프로세스 추가로 룸 수 확장, Redis presence/driver, 좌석 예약 후 해당 프로세스에 직접 WS `[A | docs.colyseus.io/scalability]` | "1 vCPU/1GB ≈ 1,000~2,000 동접(단순 게임)", 연결당 2~5KB `[A | docs.colyseus.io/faq]` | 자체 호스팅(중) / Colyseus Cloud | 임의 |
| **Nakama** | Go 단일 바이너리 클러스터(Enterprise/Heroic Cloud) | 벤치 **1코어 ≈ 20,277 CCU**, 2노드×2코어 35,723 CCU `[A | heroiclabs.com/docs/nakama/getting-started/benchmarks]` | 자체(중~상, DB 필요) / Heroic Cloud "Asia" 리전 `[A | heroiclabs.com/heroic-cloud]`; 가격은 "from $600/mo"(C) [미확인] | GCP/AWS Asia |
| **Ably** | 완전관리 Pub/Sub, 7개 코어 DC(싱가포르 포함)+635 엣지 PoP(**서울 8**), "<65ms 평균" `[A | ably.com/network]` | Free 200 / Standard 10k / Pro 50k 동접, 메시지 초당 500/2.5k/10k `[A | ably.com/pricing]` | 최저 | 코어 DC는 싱가포르(서울은 엣지) |
| **PubNub** | 완전관리, MAU 과금 | Free 200 MAU 또는 1M tx; Starter $98/1,000 MAU; Pro 맞춤 `[A | pubnub.com/pricing]` | 최저 | PoP [미확인] |
| **Pusher Channels** | 완전관리, 고정 티어 | Sandbox 100 / Pro 2,000 / Premium 10k / Growth 15k / Growth Plus 30k 동접 `[A | pusher.com/channels/pricing]` | 최저 | 클러스터 ap3 도쿄·ap1 싱가포르(서울 없음) `[A | pusher.com/docs/channels/miscellaneous/clusters]` |
| **Cloudflare Workers + Durable Objects** | DO = 룸(단일 스레드 액터), **WebSocket Hibernation**으로 유휴 시 duration 미과금, 수신 WS 메시지 20:1 과금, 송신 무료 `[A | developers.cloudflare.com/durable-objects/platform/pricing]`; 위치 힌트 `apac-ne` `[A | …/reference/data-location]` | DO당 처리량 공식 수치 없음 [미확인] → 수천 접속/룸 이상은 계층 샤딩 필요 | 낮음(서버리스) | 서울 PoP 있음(348개 도시) `[A | cloudflare.com/network]` |
| **Supabase Realtime** | Phoenix(Elixir) 기반, 관리형 | Free 200 / Pro 500(스펜드캡 해제 시 10k) / Team 10k 동접; msg/s 100/500/2,500; **channel joins/s 100/500/2,500** `[A | supabase.com/docs/guides/realtime/limits]` | 낮음 | **ap-northeast-2 서울** `[A | supabase.com/docs/guides/platform/regions]` |
| **Firebase RTDB / Firestore** | 관리형 | RTDB DB당 **200,000 동시접속**, ~100,000 응답/s, 1,000 writes/s(소프트) `[A | firebase.google.com/docs/database/usage/limits]`; Firestore ~1M 동접(B) | 낮음 | RTDB 리전 선택 제한 [미확인] |
| **LiveKit (WebRTC data)** | SFU(Go), 데이터채널 포함 | Build 무료 100동접/5k분; Ship $50 1,000동접/150k분; Scale $500 5,000동접/1.5M분, 이후 $0.0004/min `[A | livekit.com/pricing]` | 낮음(Cloud)/중(자체) | 리전 [미확인] |
| **Phoenix Channels (Elixir) 자체** | BEAM 프로세스/PubSub 샤딩 | **단일 40코어/128GB 서버 2M 접속**, 브로드캐스트 1~2s@2M(2015) `[A | phoenixframework.org/blog/the-road-to-2-million-websocket-connections | 2015-11-03]` | 자체(중, 인력 희소) | 임의 |
| **Go 순수 WS(gorilla/nhooyr) / uWebSockets.js** | 수동 샤딩 | uWS.js "13x faster than Fastify"(자체 주장) `[A | github.com/uNetworking/uWebSockets.js]` | 자체(상) | 임의 |

### 2.2 2시간 이벤트 비용 산출 (공개 단가 기반)

**트래픽 모델(공통)**: 동접 N, 120분 유지, 폰→서버 1msg/10s(0.1/s), 서버→폰 집계 상태 1msg/5s(0.2/s) → 연결분 120N, 인바운드 720N, 아웃바운드 1,440N, 총 2,160N 메시지. 메시지 ≤5KiB. 운영자 콘솔·스크린 트래픽은 무시.

| 백엔드 | N=1k | N=10k | N=100k | 계산 근거 |
|---|---|---|---|---|
| Ably | ≈ **$35** (Standard $29 + 2.16M×$2.5/M + 0.12M분×$1/M) | ≈ **$84**(Standard 상한 10k 정확히) → 여유 위해 Pro **≈ $455** | Enterprise 필수(Pro 50k 상한, Pro 10k msg/s 초과) 사용분만 ≈ $552 | 메시지 1인바운드+N아웃바운드 과금 `[A | ably.com/docs/platform/pricing/message-counting]` |
| Pusher | Pro **$99**(2,000동접, 4M/일) | Growth **$699**(Premium 20M/일 < 21.6M) | Enterprise(맞춤) | 일일 메시지·동접 티어 |
| PubNub | Starter **$98**(1,000 MAU) | Pro 맞춤(C: ~$499+) | 맞춤 | MAU 기준 |
| Supabase Realtime | Pro $25 + 500동접×$10/1k = **$30** | 접속 $120 + 메시지 $41.5 + $25 ≈ **$187**, 단 3,000 msg/s > 2,500 한도 → 지원팀 협의 | 불가(Enterprise 협의) | `[A | supabase.com/pricing]` |
| Cloudflare DO | **≈ $5**(Workers Paid; 요청 37k, duration 포함분 내) | **≈ $5** | **≈ $6**(요청 3.6M, 초과 2.6M×$0.15) — 단 100 DO 샤딩 + 집계 DO 설계 필요 | 20:1 WS 과금, 송신 무료, 하이버네이션 `[A | …/durable-objects/platform/pricing, workers/platform/pricing]` |
| Firebase RTDB | ≈ **$0**(다운로드 0.3GB, 일 360MB 무료) | ≈ **$3**(2.9GB×$1) — 1,000 writes/s 소프트 한도 도달 | ≈ **$29**(29GB) — 10k writes/s로 샤딩/배치 필수 | `[A | firebase.google.com/pricing]` |
| LiveKit Cloud | Ship **$50**(1,000동접 상한) | Scale 5,000 상한 → Enterprise | Enterprise; 분 단가만 12M분≈$4,700 | `[A | livekit.com/pricing]` |
| Colyseus/Socket.IO 자체(AWS Seoul) | VM 1대 3h ≈ **$1** + Redis | 4vCPU×2 3h ≈ **$2~3** | 8vCPU×10 3h ≈ **$20~30** + LB | docs 기준 1vCPU≈1~2k 동접 [추정] |
| Nakama 자체 | 1코어 | 1~2코어 | 6~8코어 + DB | 벤치 20k CCU/코어 `[A]` |

해석: **상시 운영 10~100 스크린**은 DO(또는 Supabase 서울)로 월 수십 달러, **대형 이벤트**는 자체 호스팅이 압도적으로 싸지만 부하 테스트·당일 운영 인력 비용이 지배. 관리형 중 **서울 리전 보유**는 Supabase·AWS·Cloudflare(엣지), Ably/Pusher는 싱가포르/도쿄 코어.

---

## 3. 대규모 참여 아키텍처 사례

| 사례 | 수치 | 아키텍처 핵심 | 출처 |
|---|---|---|---|
| **r/place 2017** | 1.1M 유저, **150k 동접**, 16.5M 타일, 72h; 180k writes/s 부하테스트; 보드 1M 픽셀을 4bit로 **500KB** | Redis **BITFIELD** 원자 쓰기, Cassandra는 이력, 보드 전체는 **CDN max-age=1s** 캐시(원본 요청 ~1/s), WebSocket 클러스터 + RabbitMQ 팬아웃, 쿨다운 ~5분(튜너블) | `[A | fastly.com/blog/reddit-on-building-scaling-rplace | 2017]`, `[A | arxiv.org/html/2408.13236v1 | 2024-08]` |
| **r/place 2022** | 87h, 1000²→2000², 16→32색, **149.6M 업데이트**(arXiv); Wikipedia: 10.5M 유저, ~2M 픽셀/h(≈550/s) | 2017 구조 유지(스냅샷+델타), 캔버스 확장 시 룸 분할 | `[A | arxiv 2408.13236]`, `[C | en.wikipedia.org/wiki/R/place]` |
| **r/place 2023** | 125h, 6회 확장 3000×2000, **122.7M 업데이트** | 동일 | `[A | arxiv 2408.13236]` |
| **Twitch Plays Pokémon** | **1.16M 참여**, **121k 피크 동시**, 16일 | 채팅 입력 큐(Anarchy=순차 실행) ↔ **Democracy=30s 창 다수결**, 모드 전환은 초다수결 | `[C | en.wikipedia.org/wiki/Twitch_Plays_Pokémon]`, 모델링 `[A | arxiv.org/html/1408.4925 | 2014-08-21]` |
| **Jackbox** | 플레이어 8~10, **관객 10,000**; 호스트 끊겨도 5분 유예 | 4글자 룸코드(jackbox.tv/QR), 폰=컨트롤러, 관객은 투표/영향만 | `[A | jackboxgames.com/blog/how-to-play-party-pack-nine-remotely]` |
| **AirConsole** | 지연 최적화 발표자료 | 롱폴링→WebSocket→**WebRTC DataChannel** 계층 폴백, 스크린이 여러 존 게임서버 ping→코드 발급, NAT 제약 ~14%는 게임서버 경유, **JS로 NTP 모사**해 버튼 시각 복원, 백트래킹 | `[A | docs.google.com/presentation/d/1t40cmrv7… (AirConsole Latency)]`, `[A | github.com/AirConsole/airconsole-api 109★]` |
| **Kahoot!** | 플랜별 50/200/1,000/2,000/**5,000**(Pro Ultra) 참가자 | 세션 PIN, 참가자 계정 불요 | `[A | kahoot360.com/pricing]` |
| **Mentimeter** | **0→70,000+ 동접을 수초 내**, 이전 벤더는 ~35k에서 붕괴, 150k 목표 | 관리형(Ably)로 이전 | `[A(벤더 사례) | ably.com/case-studies/mentimeter]` |
| **Monterosa** | EA SPORTS 사례 **30M+ 투표** | 분당 피크 투표 수치 공개 없음 [미확인] | `[A | monterosa.co/voting]` |

### 재사용 패턴

```
입력 집계 레이어 (tick 기반)
  폰 N대 ──(입력, 사용자별 토큰버킷)──► Redis ──┬─ 투표: INCR/HINCRBY → 비율
                                              ├─ 크라우드 평균: SUM/COUNT (좌표·기울기) → 스크린 커서 1개
                                              ├─ 다수결: tick(0.5~30s)마다 argmax (TPP Democracy)
                                              └─ 캔버스: BITFIELD(4bit/픽셀) → 스냅샷 PNG(CDN TTL 1s) + 델타(WS)
  스크린 ◄──(tick마다 집계 상태 1개)── 서버      ※ 폰은 "내 입력 반영됨" ACK만 받음
```
- **레이트리밋/쿨다운**: r/place 5분 쿨다운은 "튜너블 파라미터·킬스위치"로 만든 점이 교훈(Fastly). 토큰버킷(예: 5 req/10s) + 스크린별 글로벌 상한.
- **스냅샷+델타**: 신규 접속자는 CDN 스냅샷, 이후 WS 델타; 서버는 전체 상태 브로드캐스트 금지.
- **관객 vs 플레이어 분리(Jackbox)**: 게임은 소수 플레이어, 다수는 투표/응원 채널로 — 지연·공정성 문제 회피.
- **룸 샤딩 + 계층 집계**: 스크린당 룸(≤2~5k 접속)→상위 집계 룸. DO/Colyseus/Nakama 모두 이 구조에 맞음.

---

## 4. 지연·동기화

### 4.1 지연 예산

```
폰 입력 ─► 무선 구간(5G/LTE/Wi-Fi) ─► 엣지/서버 처리 ─► 스크린 WS 수신 ─► 렌더 프레임 ─► 프로세서/패널
 ~0ms        20~60ms [추정]            1~10ms            10~60ms          16~33ms       1~3프레임 [미확인]
                                      ───────────────── 합계 ≈ 100~250ms (단일 홉, 서울 리전) ─────────────────
```
- 한국 이동통신 지연(ms) 1차 자료(Opensignal 2025-12 리포트, Ookla)는 봇 차단으로 확인 실패 [미확인]; 과기정통부 2025 품질평가 기사는 5G 평균 973.55Mbps 등 속도만 보도 `[B | view.asiae.co.kr/en/article/2025123010425099142 | 2025-12-30]`. 위 20~60ms는 보수적 가정치.
- 관리형 전송의 참고치: Ably "message delivery latency 6.5ms"(내부), "<65ms 평균 글로벌" `[A | ably.com/pricing, ably.com/network]`.

### 4.2 포맷별 허용 지연

| 포맷 | 허용 | 설계 |
|---|---|---|
| 투표/설문/메시지 월 | 0.5~2s | 폰은 ACK만, 스크린 1Hz 집계 갱신 |
| 협업 드로잉/픽셀 | 200~500ms | 로컬 즉시 그리기(낙관적) + 서버 확정 색 재적용(r/place) |
| 크라우드 조종(평균 커서, 기울기) | 150~300ms | 100ms tick 이동평균, 스크린 측 보간 |
| 리듬/반응속도 게임 | <100ms 필요 | **스크린 측 판정 금지**: 폰에서 로컬 타임스탬프(동기화된 클럭)로 판정 후 결과만 전송(AirConsole NTP 방식) 또는 **클라이언트 예측+서버 조정** `[B | gabrielgambetta.com/client-side-prediction-server-reconciliation.html]` |
| 라이트/레이저 큐 | 수십 ms 동기 | 절대 시각 스케줄(§4.3) |

### 4.3 클럭 동기화
- 서버 시각 기준 NTP 유사 교환(5~10회 샘플, 지연 최소/중앙값 선택) → 오프셋 추정. 라이브러리 `timesync`(339★)는 2025-07-16 **아카이브** `[A | github.com/enmasseio/timesync]` → 자체 50줄 구현 권장.
- 큐는 "지금 발사"가 아니라 **`t0 = server_now + 1.5s` 절대시각**으로 발행, 모든 폰/스크린이 동기 클럭으로 실행(폰 플래시 라이트쇼 패턴, CUE는 초음파로 동일 목적 달성 §5).
- 미디어서버 측 동기: disguise QTP(7542/7543)·VSync(7968) UDP 동기, QoS 권장 `[A | help.disguise.one …network-ports-and-activity]`.

### 4.4 1,000명 동시 조인 버스트(콘서트 순간)
- 한도 참고: Supabase Pro **channel joins 500/s**(캡 해제 2,500/s) `[A]`; Ably Standard 2.5k msg/s `[A]`; Phoenix 벤치는 1k conn/s 램프 `[A]`; Mentimeter "0→70k in seconds"(Ably) `[A 벤더]`.
- 대책: ① 정적 PWA는 CDN(연결 전 자산 로드 완료) ② 접속 **지터 백오프**(Full Jitter 시 서버 호출 >50% 감소) `[A | aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter | 2015-03-04]` ③ WS 실패 시 **HTTP POST 투표 폴백**(결과는 폴링) ④ 룸 사전 워밍(DO는 첫 요청 위치에 생성되므로 스크린이 먼저 접속) ⑤ 입장 큐(대기실) UI.

---

## 5. QR·조인 UX 기술

### 5.1 동적 QR·딥링크
- URL 형식 `https://brand.kr/s/<screen>/<slot>?t=<jwt>`: 스크린·시간슬롯별 토큰(만료 10~30분, 서명) → 리플레이·원격 참여 차단, 어트리뷰션 키(UTM 대체). 스크린 QR은 슬롯마다 재생성(애니메이션 QR 금지, §5.3).
- 브랜드 단축 도메인은 신뢰 신호(§5.4)이자 분석 키. 벤더 비교는 §7.
- **iOS App Clips**: 공식 문서는 JS 렌더링으로 수치 확인 실패 [미확인 — 10/15/50MB 한도 기억값]. **Android Instant Apps는 2025-12 종료**: "Starting December 2025, Instant Apps cannot be published through Google Play" `[A | developer.android.com/topic/google-play-instant]` → 네이티브 '즉시실행' 노선은 iOS 단독이 되어 **PWA 일원화**가 합리적. App Clip은 카메라 AR·NFC가 필수인 경우에만.
- PWA: 설치 유도는 금지(마찰). `visibilitychange` 재접속·오프라인 큐만 사용.

### 5.2 QR 가독성(LED) 규칙
- DENSO WAVE: **쿼이트존 4모듈**, 모듈은 "4도트 이상" 권장, 스캐너 해상도가 모듈보다 작아야 함 `[A | qrcode.com/en/howto/code.html, /howto/cell.html]`; 오류정정 "Level M(15%) 가장 흔함, 더러운 환경은 Q/H" `[A | qrcode.com/en/about/error_correction.html]` (L 7%/H 30%는 표 이미지 내, 텍스트 미확인).
- LED 적용: **1모듈 = 정수 LED 픽셀(권장 2~3px)**로 모아레 방지, 버전은 URL 단축으로 **v2(25모듈)~v3(29모듈)** 유지. 예) 피치 10mm, v2+쿼이트존=33모듈×3px=99px ≈ **0.99m** 폭.
- 거리 규칙 "QR 폭 ≈ 스캔 거리/10"은 업계 통용치이나 벤더 페이지 fetch 실패 [미확인] → 위 예시는 ~10m 스캔 가정. 반전(흰 모듈 위 검정 배경 반전) QR·움직이는 QR·저대비·곡면 매핑 금지, 프레임 리프레시/카메라 셔터 밴딩 고려해 **정지 프레임 3초 이상** 노출.
- 폴백: 4~6자 룸코드(Jackbox 4글자) + 짧은 URL 텍스트 병기.

### 5.3 QR 대안
- **CUE(구 CUE Audio)**: "Inaudible data-over-audio controls the phones screen and flash. No app, no problem." 웹 기반 라이트쇼는 QR/링크로 즉시 참여, 경기장 사례 "almost 60% adaptation" `[A(벤더) | connectwithcue.com]` — 트리거/동기 큐에 적합, 양방향 입력엔 부적합.
- NFC/BLE: 대형 스크린 거리에서 무의미, 키오스크 보조용. 

### 5.4 안티-퀴싱·봇·세션
- FTC(2023-12-06): 주차미터 QR 덮어붙이기 등, "URL을 확인하라" `[A | consumer.ftc.gov/consumer-alerts/2023/12/…]` → 스크린에 **도메인 텍스트 노출·HTTPS·리다이렉트 1홉 이하**, 랜딩 첫 화면에 운영사/브랜드와 스크린 이름 표기.
- **Cloudflare Turnstile**: Managed/Non-interactive/Invisible, 무료 티어 **위젯 20개·호스트명 10/위젯** `[A | developers.cloudflare.com/turnstile/, /turnstile/plans]` + 서버 측 토큰 버킷 + 스크린별 토큰 만료.
- 로그인 없는 신원: 1st-party 쿠키/localStorage의 서명 세션 ID(+슬롯 토큰)가 기본. 디바이스 핑거프린트는 보조: FingerprintJS OSS는 상용 대비 "significantly lower" 정확도, MIT, 28.5k★ `[A | github.com/fingerprintjs/fingerprintjs]`.
- 연령 게이트: 자기신고 + 콘텐츠 등급별 모더레이션 강화; 법적 요건 [미확인].

---

## 6. 모더레이션 스택

```
입력 ─► 포맷 제약(길이·문자셋·스탬프/팔레트) ─► 사전 필터(한국어 금칙어·정규식·URL/전화번호 차단)
   ─► ML API(텍스트: OpenAI omni-moderation(무료) / Hive, 이미지·드로잉: Rekognition·Vision SafeSearch·Hive·nsfwjs)
   ─► 점수화·자동 승인/차단 ─► [30~90s 지연 버퍼] 사람 승인 큐(단축키, 일괄) ─► 스크린 게시 ─► 감사로그·보존·삭제
```

| 서비스 | 지원 | 비용(공개) | 한국어 | 출처 |
|---|---|---|---|---|
| OpenAI `omni-moderation-latest` | 텍스트+이미지(≤20MB), 13개 카테고리(일부 텍스트 전용) | **무료** | 다국어 개선 발표(2024-09)는 블로그 403으로 [미확인] | `[A | developers.openai.com/api/docs/guides/moderation]` |
| Google Perspective | TOXICITY 등 | 무료(쿼터) | 문서 JS 렌더로 확인 실패 [미확인] | `developers.perspectiveapi.com` |
| Hive | Visual $3.00/1k, Text $0.50/1k, 기본 100 req/일 상한(영업 시 확대), $50 크레딧 | 좌 | [미확인] | `[A | thehive.ai/pricing]` |
| AWS Rekognition DetectModerationLabels | 이미지 | **$1.00/1k**(첫 1M), 0.8/0.6/0.25 체감 | — | `[A | aws.amazon.com/rekognition/pricing]` |
| AWS Comprehend | 언어표에 ko 포함(엔티티·키프레이즈·감성), **toxicity 행은 표에 없음** [미확인] | — | 부분 | `[A | docs.aws.amazon.com/comprehend/latest/dg/supported-languages.html]` |
| Google Vision SafeSearch | 이미지 | 1k 무료, **$1.50/1k**, 5M+ $0.60/1k(Label과 동시 호출 시 무료) | — | `[A | cloud.google.com/vision/pricing]` |
| Naver CLOVA GreenEye / Kakao | 페이지 404(서비스 종료/개편 가능) [미확인] | — | — | — |
| 오픈 데이터(한국어) | **UnSmile** 18,742문장·10라벨, 데이터 CC-BY-NC-ND(상용은 문의) 447★; **KoCoHub** 9,381 라벨, CC-BY-SA 400★; **Curse-detection-data** 5,825문장 MIT 116★; **korean-bad-words** 리스트 MIT 63★ | 무료 | ○ | `[A | github.com/smilegate-ai/korean_unsmile_dataset, kocohub/korean-hate-speech, 2runo/Curse-detection-data, doublems/korean-bad-words]` |
| 드로잉 | **nsfwjs**(Drawing/Hentai/Neutral/Porn/Sexy, "~93% midsized", 브라우저 추론, 9.0k★) / nsfw_model 2.1k★ — 사진·애니 기반이라 **낙서 성기 그림 등은 미검출 가능성** [미확인 성능] | 무료 | — | `[A | github.com/infinitered/nsfwjs, GantMan/nsfw_model]` |

실무 지침: ① 공공 스크린은 **사전 승인(pre-moderation)만** 허용, 자동 승인은 "스탬프/이모지 팔레트·선택지 투표"처럼 입력 공간이 닫힌 포맷에 한정 ② 자유 드로잉은 **템플릿 제약**(색칠·스텐실·대칭 브러시·시간 제한) + 사람 승인 ③ 텍스트는 금칙어→ML→사람 3단, 한국어 변형(자모 분리·숫자 치환) 정규화 ④ 승인 UI: 30~90s 버퍼 큐, 2인 중 1인 승인, 단축키, 스크린 즉시 회수(kill) ⑤ 감사로그(누가·언제·무엇을 승인) 1년, 원본 UGC는 이벤트 종료 후 30일 내 삭제, 개인정보 비수집 원칙.

---

## 7. 분석·어트리뷰션 연동

| 벤더 | 공개 플랜 | 비고 |
|---|---|---|
| Flowcode | Free 코드 2개/500스캔; Pro Plus **$25/월(연납)** 50코드·6,000스캔·커스텀 도메인 5; Growth $250/년~; 지오·스마트라우팅은 Growth+ `[A | flowcode.com/pricing]` | |
| Bitly | Free QR 2; Core $10; Growth **$29**(커스텀 도메인 1, 4개월 보존); Premium $199(1년 보존, 딥링크) `[A | bitly.com/pages/pricing]` | 연납 환산가 |
| Uniqode | "$9/월~", Core $49/월, 커스텀 도메인 애드온 **$2,000/년**, 연납만 `[A(부분) | uniqode.com/pricing]` | 표 추출 불완전 |
| QR Tiger | 가격 페이지 404 [미확인] | |

자체 구현 권장: QR 토큰이 곧 분석 키이므로 외부 QR 벤더 없이 **스캔→랜딩→참여→완료** 퍼널을 자체 로그(스크린·슬롯·시간대·고유 세션)로 집계하고, 벤더는 "브랜드 도메인 관리" 용도만.

**미디어 운영사/pDOOH 노출 신호**: Vistar(DSP+SSP) `[A | vistarmedia.com]`, Place Exchange **PerView**(도달·빈도·임프레션 측정) `[A | placeexchange.com]`, Broadsign Reach는 페이지에 "Place Exchange by Broadsign" 표기·55+ DSP·날씨/스코어 트리거 DCO `[A | broadsign.com/broadsign-reach]`, VIOOH(JCDecaux, 50+ DSP) `[A | viooh.com]`, Hivestack→**Perion**(hivestack.com이 perion.com으로 리다이렉트, ">1.7M DOOH screens") `[A]`. 이들 SSP는 QR 참여를 표준 지표로 받지 않음 [미확인] → 우리 플랫폼이 "스크린·슬롯별 **참여수/고유참여/체류(세션 길이)/완료율**"을 리포트 API·CSV로 내보내고, 운영사는 이를 pDOOH 딜의 부가 KPI(engagement rate)로 패키징하는 구조가 현실적.

**노출 측정 센서**: Quividi(월 2Bn 임프레션, 80개국, privacy-by-design, Broadsign/Vistar/Place Exchange 연동) `[A | quividi.com]`, AdMobilize(35B 임프레션, "95% 정확도" 주장, BrightSign/Broadsign 연동) `[A | admobilize.com]` → **리프트 측정** = (인터랙션 슬롯 vs 일반 슬롯)의 주목 시간·체류 비교.

---

## 8. WebAR·카메라 연동

| 플랫폼 | 2025~2026 상태 | 출처 |
|---|---|---|
| **8th Wall / Niantic** | "**All paid subscriptions ended on February 28, 2026 when the hosted platform was retired**", XR Engine 바이너리 상용 무료 배포, 오픈소스 유틸(MIT), **셀프 호스팅**, 프로젝트 export 종료, 저작권 Niantic Spatial | `[A | 8thwall.org/?site_path=pricing | 확인 2026-10-01]` |
| **Zappar/Zapworks** | Developer $12.99/월(비상업), **Pro $315/월**(12k views/년, 50MB), Enterprise 화이트라벨·커스텀 호스팅; Universal AR SDK 포함 | `[A | zap.works/pricing]` |
| **Snap Camera Kit** | iOS/Android/**Web** 지원, 가격 비공개 | `[A | ar.snap.com/camera-kit]` |
| **TikTok Effect House** | TikTok 앱 내 전용, 웹/SDK 배포 없음 | `[A | effecthouse.tiktok.com]` |

판단: 스크린 중심 경험에서 AR이 가치 있는 경우는 ① 스크린 자체를 이미지 타깃으로 쓰는 "스크린 확장"(파사드에서 튀어나오는 요소) ② 셀피 필터 → 스크린 게시(UGC) 둘뿐. 폰 카메라를 켜는 순간 조인 전환율·배터리·권한 마찰이 커지므로 **기본 포맷은 non-AR**, AR은 캠페인 옵션. 8th Wall 플랫폼 종료로 상용 WebAR은 Zapworks 또는 자체 호스팅(8th Wall 엔진/MindAR 등)으로 재편.

---

## 9. 오픈소스/레퍼런스 레포 (★는 확인 2026-10-01)

| 범주 | 레포 | ★ | 메모 |
|---|---|---|---|
| 실시간 프레임워크 | socketio/socket.io 63.2k · colyseus/colyseus 7.3k(MIT) · heroiclabs/nakama 13.5k(Apache-2) · livekit/livekit 21.2k · phoenixframework/phoenix 23.2k · supabase/realtime 7.6k(Elixir) · uNetworking/uWebSockets.js 9.2k | | 모두 활성 |
| 엣지 룸 | partykit/partykit 5.7k(개발은 cloudflare/partykit로 이동) · cloudflare/workers-chat-demo 1.1k(DO + **WebSocket Hibernation**, IP 레이트리밋 DO) | | DO 레퍼런스 |
| 저지연 UDP | geckosio/geckos.io 1.5k(WebRTC DataChannel, BSD-3) | | 폰 컨트롤러용 |
| 폰 컨트롤러 | AirConsole/airconsole-api 109 · colyseus/colyseus-examples 198 | | Jackbox류 OSS 대표작은 [미확인] |
| 픽셀 캔버스 | pxlsspace/Pxls 259(Java/Postgres/WS, MIT) · (pixelplanet 등은 URL 확인 실패) | | r/place 클론 |
| TouchDesigner | DBraun/TouchDesigner_Shared 1.0k(DATs 폴더; WS 예제 포함 여부 [미확인]) + 공식 Web Server DAT 문서 | | |
| Resolume | bitfocus/companion-module-resolume-arena 28(OSC 7000 + REST 8080/WS 피드백) · trevormarrr/showcall 4 | | |
| Pixera | Tedcharlesbrown/Pixera-TCB 10(Python 래퍼·API 문서) · bitfocus/companion-module-avstumpfl-pixera 0 | | |
| disguise | disguise-one/RenderStream-UE 81 · designer-pythonapi 4 · vue-liveupdate 4(Live Update WebSocket API) | | |
| OSC | adzialocha/**osc-js** 283(UDP·WebSocket·**브리지 모드**, MIT) · MylesBorins/**node-osc** 458(Apache-2.0로 2025-12 재라이선스) | | 웹→OSC 브리지 핵심 |
| 모더레이션 | infinitered/nsfwjs 9.0k · GantMan/nsfw_model 2.1k · 한국어 데이터 4종(§6) | | |
| 사이니지 | xiboplayer/xiboplayer 1(AGPL, PWA/Electron/Chromium 플레이어 SDK) | | |
| 보조 | enmasseio/timesync 339(**아카이브 2025-07**) · fingerprintjs 28.5k | | |

---

## 10. 비용 추정

가정: 서울 리전, 관리형 DB(Postgres) 1개, 정적 자산 CDN, 모니터링 기본. 인건비 제외. 단가는 §2·§6·§7 공개가.

| 시나리오 | 트래픽 가정 | 인프라 월비용(추정) | 구성 |
|---|---|---|---|
| **(i) 10 스크린 상시 라이트 인터랙션** | 스크린당 평균 5·피크 50 동접, 1인 0.4msg/s → 월 ~52M 메시지, UGC 1k/일/스크린 | **$100~400** | 실시간: DO ≈ $5~15 또는 Supabase Pro $25+ 또는 Ably ≈ $160; DB $25~60; CDN/호스팅 $0~20; 모더레이션 OpenAI 무료 + 이미지 10k/월 $10~30 + Hive 텍스트 $150(선택); 관측 $0~50. (b)경로 선택 시 렌더박스 CAPEX 별도 |
| **(ii) 3시간 이벤트, 참여 20k(피크 동접 ~15k)** | 평균 8k 동접×180분, 26M 메시지, 텍스트 60k·드로잉 20k | **$100~900**(1회) | 자체 Colyseus/Socket.IO 2×8vCPU+Redis ≈ $20 / Ably Pro ≈ $470 / Pusher Growth $699 / DO ≈ $10; 모더레이션 자동 $30~100 + 인력 2~3명×4h; QR 도메인 $25~30; Turnstile 무료; CDN 40GB ≈ $0~5; 리허설·부하테스트 1일 별도 |
| **(iii) 100 스크린 SaaS** | 스크린당 평균 10 동접 24/7 → 월 ~1.0B 메시지, UGC 3M/월 | **$500~1,500(자체 실시간) / $1,500~4,000(관리형)** | 자체: 3×4vCPU + 관리형 Redis·Postgres ≈ $300~500; 관리형 Ably ≈ $900~3,000(볼륨 할인 $0.5/M 적용 시 하한); DO ≈ $20~50; 모더레이션 이미지 100k $100~300, 텍스트 OpenAI 무료(Hive 시 $1,500); 관측·백업·스테이징 $100~300 → **스크린당 $5~40/월** → 판가 ₩5~15만/스크린/월 가능 |

**MVP 개발 공수(투표+드로잉+메시지월+미니게임 1종+CMS+모더레이션)**: 총 **10~12 인월**(3인 팀 ≈ 4개월; 범위 8~14).
- 실시간 코어(룸/세션/집계/레이트리밋/스냅샷) 1.5 · 폰 PWA 4포맷 2.0 · 스크린 렌더러(사이니지 HTML5 + TD/NDI/OSC 브리지) 1.5 · CMS/운영(스크린 레지스트리·스케줄·QR 발급·모더레이션 콘솔·대시보드) 2.5 · 모더레이션 파이프라인(API·한국어 사전·사람 큐·감사·보존) 1.0 · QA/부하/보안/현장(Tizen·webOS·BrightSign 실기) 1.5 · 디자인 1.0.
- 가장 큰 변동 요인: 사이니지 **인증서/파트너 승인 리드타임**과 운영사별 현장 테스트(각 1~3주).

---

## 11. 함정·실패 포인트

| 영역 | 함정 | 근거/대책 |
|---|---|---|
| iOS Safari | iOS 15.0~15.3에서 백그라운드/절전 후 WebSocket이 "closed before the connection is established"로 재접속 불가(CFNetwork 버그, 15.4에서 수정) `[A | bugs.webkit.org/show_bug.cgi?id=228296 | 2021-07~2022-02]`; 앱이 suspend되면 OS가 소켓을 조용히 끊음(Apple DTS: "running/suspended가 핵심") `[A | developer.apple.com/forums/thread/716118 | 2022-09]` | `visibilitychange`/`pageshow`/`focus`에서 ping-pong 프로브 후 **즉시 재접속**, 타이머에 의존 금지, 서버 측 세션 복구(Socket.IO CSR은 Redis adapter 미지원→Streams adapter) `[A]` |
| 통신사 NAT/방화벽 | RFC 5382는 TCP 유휴 타임아웃 **2h4m 이상(MUST)** `[A | rfc-editor.org/rfc/rfc5382 | 2008-10]`이지만 셀룰러 방화벽 측정(73개 통신사)에서 **11개는 <10분, 4개는 ≤5분**, 한 통신사는 **255초**에 RST `[A | SIGCOMM'11 "An Untold Story of Middleboxes in Cellular Networks" | 2011]` | 앱 레벨 keepalive **≤4분**(권장 25~45s, 배터리 트레이드오프), 재접속 지터 |
| 캡티브 포털 | DNS/HTTP 변조형 포털은 "브라우저 외 앱을 깨뜨리고, 다른 프로토콜 앱은 알림조차 못 받음", HTTPS MITM 시도도 존재 `[A | rfc-editor.org/rfc/rfc8952 | 2020-09]` | 경기장 Wi-Fi 의존 금지(LTE 기본), 첫 로드는 HTTPS 정적 페이지로 포털 감지 후 안내 |
| 배터리/백그라운드 | 폰이 꺼지면 세션 유실; 라이트쇼는 화면 켜짐 유지 필요 | Wake Lock API(지원 편차), 참여는 짧은 세션으로 설계 |
| 플레이어 엔진 편차 | BrightSign OS별 Chromium 45~120 `[A]`; Yodeck 기본 WebKit·Chromium 투명 불가 `[A]`; Tizen 8 커스텀앱 파트너 인증서 필수 `[C]` | 폴리필·번들 타깃 ES2017, 기능 감지, 스크린 앱은 2D Canvas 중심(WebGL 선택적) |
| 미디어서버 웹 레이어 | TD Web Render TOP "as-is, no support" `[A]`; disguise Web layer **소프트웨어 렌더** `[A]`; Ventuz 첫 GPU만·팝업 불가 `[A]`; Resolume 브라우저 소스 없음 `[A]` | UI는 NDI/Spout 보조 렌더, 서버엔 숫자만 |
| 외부 입력/EDID/HDCP | 운영사 정책·EDID 핸드셰이크 이슈는 공개 자료 부재 [미확인] | 고정 EDID 에뮬레이터, HDCP 없는 소스, 리허설 |
| 폰트/이모지 | Tizen/webOS 사이니지의 컬러 이모지·한글 폰트 커버리지 [미확인] | 웹폰트 서브셋 자체 호스팅, 이모지는 SVG 스프라이트로 렌더 |
| 캐싱 | Yodeck는 캐시 문제로 프라이빗 모드 실행 `[A]`; 플레이어 CMS가 URL을 캐시해 구버전 노출 | 자산 해시 파일명, HTML `no-store`, 버전 핸드셰이크 후 강제 리로드 |
| 시간 동기 | 플레이어 시계 오차(날짜 오류 시 TLS 실패 사례 `[B | signageOS 가이드]`) | 서버 오프셋 기반 스케줄(§4.3) |
| 스케일 | 단일 DO/룸 과부하, 소켓 노드 스티키 세션 누락(HTTP 400) `[A]` | 스크린당 룸 + 계층 집계, LB 쿠키/IP 해시 |
| 보안/남용 | 퀴싱 스티커 `[A FTC]`, 봇 투표 | 도메인 노출, Turnstile, 토큰 만료, 사용자별 쿨다운, 이상치 제거(중앙값) |

---

## 12. 주요 출처 (URL | 제목 | 날짜 | 등급)

1. https://docs.derivative.ca/Web_Render_TOP | Web Render TOP | 확인 2026-10-01 | A
2. https://docs.derivative.ca/Palette:webBrowser | Palette:webBrowser (as-is 고지) | 확인 2026-10-01 | A
3. https://docs.derivative.ca/WebSocket_DAT · https://docs.derivative.ca/Web_Server_DAT · https://docs.derivative.ca/OSC_In_DAT | TD DAT 문서 | 확인 2026-10-01 | A
4. https://resolume.com/support/en/restapi · https://resolume.com/support/en/websocket-api · https://resolume.com/support/en/ndi | Resolume REST/WebSocket/NDI | v7.8 문서, 확인 2026-10-01 | A
5. https://help.pixera.one/api-quick-start-guide · https://pixera.one/fileadmin/user_upload/products/Media_Control/Pixera/api/pixera_api_documentation_5.pdf | Pixera API | 확인 2026-10-01 | A
6. https://help.disguise.one/designer/layers/layer-types/content/web-layer · …/renderstream-layer · …/control/osccontrol · https://help.disguise.one/designer/networking/network-ports-and-activity | disguise Designer 문서 | 확인 2026-10-01 | A
7. https://www.ventuz.com/support/help/latest/NodeInteractionTouchWebBrowser.html | Ventuz Web Browser 노드 | 확인 2026-10-01 | A
8. https://manual.notch.one/0.9.21/en/topic/web-api · https://manual.notch.one/2026.1/en/docs/web-gui/ | Notch Web/HTTP API | 확인 2026-10-01 | A
9. https://dev.epicgames.com/documentation/en-us/unreal-engine/getting-started-with-pixel-streaming-in-unreal-engine · …/remote-control-api-websocket-reference-for-unreal-engine | Unreal Pixel Streaming / Remote Control | 확인 2026-10-01 | A
10. https://developer.vuplex.com/webview/overview · https://store.vuplex.com/ | Vuplex 3D WebView | 확인 2026-10-01 | A
11. https://docs.brightsign.biz/releases/chromium-downloads | BrightSign Chromium 버전표 | 확인 2026-10-01 | A
12. https://docs.broadsign.com/broadsign-control/latest/en/broadsign-control-player-api.html | Broadsign Player API | 확인 2026-10-01 | A
13. https://xibosignage.com/docs/developer/widgets/embedded · https://docs.xibosignage.com/developer/player-control/player-info | Xibo 위젯/플레이어 | 확인 2026-10-01 | A
14. https://www.yodeck.com/docs/user-manual/build-a-web-widget/ | Yodeck Web App | 확인 2026-10-01 | A
15. https://build.signagelive.com/widget-sdk/ | Signagelive Widget SDK | 확인 2026-10-01 | A
16. https://www.samsung.com/sec/business/display-solutions/magicinfo/ · https://www.samsung.com/sec/business/display/vxt-solution/ | MagicINFO / VXT | 확인 2026-10-01 | A
17. https://docs.signageos.io/devices/device-provisioning/device-guides/samsung/samsung-tizen-device-provisioning/ · …/lg-webos-device-provisioning/ | signageOS 프로비저닝 가이드 | 확인 2026-10-01 | B
18. https://gist.github.com/aweussom/28c7e9f06fee0eb7db91476d800cbfa0 | Tizen 8.0 커스텀앱 배포 가이드 | 확인 2026-10-01 | C
19. https://webossignage.developer.lge.com/ | LG webOS Signage Developer | 확인 2026-10-01 | A
20. https://www.novastar.tech/product/detail.html?catid=3&id=39 | NovaStar H 시리즈 | 확인 2026-10-01 | A
21. https://socket.io/docs/v4/redis-adapter/ · /performance-tuning/ · /connection-state-recovery | Socket.IO 문서 | 확인 2026-10-01 | A
22. https://docs.colyseus.io/scalability · https://docs.colyseus.io/faq | Colyseus | 확인 2026-10-01 | A
23. https://heroiclabs.com/docs/nakama/getting-started/benchmarks/ · https://heroiclabs.com/heroic-cloud/ | Nakama 벤치/Heroic Cloud | 확인 2026-10-01 | A
24. https://ably.com/pricing · https://ably.com/network · https://ably.com/docs/platform/pricing/message-counting | Ably 가격/네트워크/과금 | 확인 2026-10-01 | A
25. https://www.pubnub.com/pricing/ | PubNub Pricing | 확인 2026-10-01 | A
26. https://pusher.com/channels/pricing/ · https://pusher.com/docs/channels/miscellaneous/clusters/ | Pusher 가격/클러스터 | 확인 2026-10-01 | A
27. https://developers.cloudflare.com/durable-objects/platform/pricing/ · …/reference/data-location/ · https://developers.cloudflare.com/workers/platform/pricing/ · https://www.cloudflare.com/network/ | Cloudflare DO/Workers/네트워크 | 확인 2026-10-01 | A
28. https://supabase.com/docs/guides/realtime/limits · https://supabase.com/pricing · https://supabase.com/docs/guides/platform/regions | Supabase | 확인 2026-10-01 | A
29. https://firebase.google.com/docs/database/usage/limits · https://firebase.google.com/pricing | Firebase | 확인 2026-10-01 | A
30. https://livekit.com/pricing | LiveKit Pricing | 확인 2026-10-01 | A
31. https://www.phoenixframework.org/blog/the-road-to-2-million-websocket-connections | Phoenix 2M | 2015-11-03 | A
32. https://docs.aws.amazon.com/general/latest/gr/rande.html | AWS 리전표(ap-northeast-2) | 확인 2026-10-01 | A
33. https://www.fastly.com/blog/reddit-on-building-scaling-rplace | Reddit on building & scaling r/place | 2017 | A
34. https://arxiv.org/html/2408.13236v1 | Large-scale Collective Dynamics in the Three Iterations of r/place | 2024-08 | A
35. https://en.wikipedia.org/wiki/R/place · https://en.wikipedia.org/wiki/Twitch_Plays_Pok%C3%A9mon | 위키 | 확인 2026-10-01 | C
36. https://arxiv.org/html/1408.4925 | A Crude Analysis of Twitch Plays Pokemon | 2014-08-21 | A
37. https://www.jackboxgames.com/blog/how-to-play-party-pack-nine-remotely | Jackbox 원격 플레이 | 확인 2026-10-01 | A
38. https://docs.google.com/presentation/d/1t40cmrv7NT45rRwsJUXqZC2uOmZBS0Cbs9jG1J_Jdzc/htmlpresent | AirConsole – Latency | 확인 2026-10-01 | A
39. https://kahoot360.com/pricing/ | Kahoot! 360 Pro 가격/참가자 한도 | 확인 2026-10-01 | A
40. https://ably.com/case-studies/mentimeter | Mentimeter 사례 | 확인 2026-10-01 | A(벤더)
41. https://monterosa.co/voting | Monterosa Voting | 확인 2026-10-01 | A(벤더)
42. https://view.asiae.co.kr/en/article/2025123010425099142 | MSIT 2025 품질평가 보도 | 2025-12-30 | B
43. https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html | Client-Side Prediction and Server Reconciliation | 확인 2026-10-01 | B
44. https://github.com/enmasseio/timesync | timesync (archived 2025-07-16) | 확인 2026-10-01 | A
45. https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/ | Exponential Backoff And Jitter | 2015-03-04 | A
46. https://www.qrcode.com/en/howto/code.html · /howto/cell.html · /about/error_correction.html | DENSO WAVE QR 규격 | 확인 2026-10-01 | A
47. https://developer.android.com/topic/google-play-instant | Google Play Instant 종료 고지 | 확인 2026-10-01 | A
48. https://www.connectwithcue.com/ | CUE data-over-audio | 확인 2026-10-01 | A(벤더)
49. https://developers.cloudflare.com/turnstile/ · /turnstile/plans/ | Turnstile | 확인 2026-10-01 | A
50. https://consumer.ftc.gov/consumer-alerts/2023/12/scammers-hide-harmful-links-qr-codes-steal-your-information | FTC QR 사기 경보 | 2023-12-06 | A
51. https://github.com/fingerprintjs/fingerprintjs | FingerprintJS | 확인 2026-10-01 | A
52. https://developers.openai.com/api/docs/guides/moderation | OpenAI Moderation | 확인 2026-10-01 | A
53. https://thehive.ai/pricing | Hive Pricing | 확인 2026-10-01 | A
54. https://aws.amazon.com/rekognition/pricing/ · https://docs.aws.amazon.com/comprehend/latest/dg/supported-languages.html | AWS 가격/언어 | 확인 2026-10-01 | A
55. https://cloud.google.com/vision/pricing | Cloud Vision Pricing | 확인 2026-10-01 | A
56. https://github.com/smilegate-ai/korean_unsmile_dataset · https://github.com/kocohub/korean-hate-speech · https://github.com/2runo/Curse-detection-data · https://github.com/doublems/korean-bad-words | 한국어 혐오/욕설 데이터 | 확인 2026-10-01 | A
57. https://github.com/infinitered/nsfwjs · https://github.com/GantMan/nsfw_model | NSFW 분류기 | 확인 2026-10-01 | A
58. https://www.flowcode.com/pricing · https://bitly.com/pages/pricing · https://www.uniqode.com/pricing | QR 분석 벤더 | 확인 2026-10-01 | A
59. https://www.vistarmedia.com/ · https://www.placeexchange.com/ · https://broadsign.com/broadsign-reach/ · https://www.viooh.com/ · https://perion.com/ | pDOOH SSP/DSP | 확인 2026-10-01 | A
60. https://www.quividi.com/ · https://www.admobilize.com/ | 관객 측정 | 확인 2026-10-01 | A(벤더)
61. https://8thwall.org/?site_path=pricing · https://zap.works/pricing/ · https://ar.snap.com/camera-kit · https://effecthouse.tiktok.com/ | WebAR | 확인 2026-10-01 | A
62. https://bugs.webkit.org/show_bug.cgi?id=228296 · https://developer.apple.com/forums/thread/716118 | iOS WebSocket 이슈 | 2021-07/2022-09 | A
63. https://www.rfc-editor.org/rfc/rfc5382 · https://www.rfc-editor.org/rfc/rfc8952 | NAT TCP 요구사항 / 캡티브 포털 아키텍처 | 2008-10 / 2020-09 | A
64. https://conferences.sigcomm.org/sigcomm/2011/papers/sigcomm/p374.pdf | An Untold Story of Middleboxes in Cellular Networks | 2011 | A
65. GitHub 레포 페이지(§9 표의 각 URL) | 스타·라이선스 | 확인 2026-10-01 | A
66. https://github.com/disguise-one · https://github.com/bitfocus/companion-module-resolume-arena · https://github.com/adzialocha/osc-js · https://github.com/MylesBorins/node-osc | 통합 레포 | 확인 2026-10-01 | A

---

## 13. 불확실/추가조사 필요

1. **한국 모바일 지연 실측(ms)**: Opensignal 2025-12·Ookla 페이지 접근 차단. 과기정통부 품질평가 원문(지연시간 항목) 확보 또는 자체 측정(서울 5G/LTE/공공 Wi-Fi, 폰→Seoul 리전 WS RTT) 필요.
2. **사이니지 플레이어별 브라우저 엔진 버전**(Tizen 6.5/7/8, webOS 4/6, Android DID)과 Canvas/WebGL 성능 — 실기 벤치 필요. Tizen 8 URL Launcher 동작 변화(C 등급 gist)는 삼성 파트너 문서로 재확인.
3. **미디어 운영사 외부 입력·웹앱 설치 정책** — 공개 문서 없음. 국내 주요 운영사(옥외 전광판·몰·경기장·지하철 DID) 인터뷰 필요.
4. **Cloudflare DO 룸당 실질 처리량**(접속 수·msg/s) — 공식 수치 없음, 부하 테스트 필요.
5. **Perspective API 한국어 지원·Comprehend toxicity 언어·Naver/Kakao 유해 콘텐츠 API 현황** — 문서 접근 실패/404. 한국어 텍스트 모더레이션은 OpenAI 무료 엔드포인트 + 한국어 데이터셋 파인튜닝 소형 모델 벤치 권장.
6. **드로잉 모더레이션 성능**(낙서·선화 대상) — nsfwjs류의 재현율 미검증, 자체 데이터셋 구축 필요.
7. **App Clips 크기 한도·QR 10:1 규칙·QR Tiger 가격·Brompton 입력 사양** — 1차 페이지 fetch 실패(JS 렌더/404).
8. **Nakama Heroic Cloud 실가격**(from $600/mo는 C 등급), **PubNub Pro 가격**, **Firebase RTDB 리전**, **LiveKit 리전**.
9. **pDOOH SSP가 외부 engagement 신호를 수용하는 공식 경로** 유무(Vistar/Place Exchange/VIOOH 세일즈 확인).
10. **Monterosa 피크 투표율, Kahoot/Mentimeter 내부 아키텍처** — 벤더 주장만 존재.
11. **법무**: 공공장소 UGC 게시 책임, 연령 게이트 요건, 개인정보(세션 식별자) 보존 기간 — 국내 법률 검토.
