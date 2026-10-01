# 스마트폰 × 대형 공공 스크린 참여 설계 — 학술 전수조사 + 실무자 압수수색 리포트

- 조사일: 2026-10-01 / 의뢰: 미디어아트 테크니컬 디렉터(참여형 대형 스크린 콘텐츠 제품화)
- 등급 기준: **A** 동료심사 논문·공식 가이드라인·1차 데이터 / **B** 신뢰 매체·업계 리서치·공인 전문가 / **C** 포럼·블로그·벤더 자료
- 조사 환경 메모(투명성): 본 세션은 일반 웹검색 쿼터 소진 상태에서 수행되어, 논문 PDF 직접 수집(pdftotext), Crossref API, 사이트 내부검색(Sixteen:Nine 아카이브=invidis.com, OAAA, Lumen, Ocean, Outfront), Seznam 검색, 네이버 뉴스·블로그 크롤링으로 대체했다. Reddit·LinkedIn 원문, ACM DL 본문, Semantic Scholar/OpenAlex는 네트워크 차단(403/429)으로 접근 불가 → 해당 항목은 [미확인] 표기(9절).

---

## 1. 학술 연구 핵심

### 1.1 핵심 모델 한눈에 보기

| 모델 | 핵심 주장 | 제품 설계 함의 | 출처 (날짜, 등급) |
|---|---|---|---|
| Honeypot effect (Brignull & Rogers, Opinionizer) | 이미 상호작용 중인 사람(군집)이 다른 행인의 주의를 끌고 접근·참여를 유도. 동시에 공개 상황의 사회적 압력·어색함(awkwardness)이 참여를 억제 | "먼저 참여하는 사람"을 만들어 주는 장치(스태프 시드, 지인 동반)와 스크린 앞 체류 공간 확보 | INTERACT'03 (2003) https://www.researchgate.net/publication/221054596_Enticing_People_to_Interact_with_Large_Public_Displays_in_Public_Spaces — A |
| Audience Funnel (Michelis & Müller) | 지나감 → 보기·반응 → 미묘한 상호작용 → 직접 상호작용 → 복수 상호작용 → 후속 행동의 6단계. 베를린 Magical Mirrors에서 주말 저녁 2일간 660명 관찰. 단계마다 임계(threshold)가 있고 전환율로 디스플레이를 비교 가능 | KPI를 단계별 전환율로 정의(예: 시선율→접근율→스캔율→완료율). 각 임계마다 전용 장치 필요 | IJHCI 27(6), 2011, DOI 10.1080/10447318.2011.555299 — A. 단계별 전환 수치는 원문 미확보 [미확인] |
| Requirements & design space (Müller, Alt, Michelis, Schmidt) | 공공 디스플레이는 "주의 끌기→동기 부여→공공 상황 대처"가 핵심 요구. Magical Mirrors 분석에서 **"자신의 상호작용 결과를 눈으로 보는 것"이 가장 중요한 동기 요소**, 창발적 목표(emergent goal)가 지속 참여를 만든다. 포스터 모델은 광고 연상 때문에 display blindness 유발. 여가 목적 행인이 업무 목적 행인보다 참여 확률 높음. 통행로를 막으면 "민폐" 때문에 중단 | 즉각적·가시적 피드백이 1순위. 목표를 열어둔 샌드박스형. 포스터처럼 보이지 않게. 설치 위치는 통행로 밖 "여가 동선" | ACM MM'10 (2010-10) https://dl.acm.org/doi/10.1145/1873951.1874203 (PDF: http://www.florian-alt.org/unibw/wp-content/publications/mueller2010mm.pdf) — A |
| Looking Glass (Müller, Walter, Bailly, Nischt, Alt) | 쇼윈도 3곳·3주·502세션. 행인의 **거울상(mirror image)을 즉시 보여주면 CTA형 어트랙트 루프 대비 상호작용 +90%, 실루엣 +47%**. 실험실에서 인터랙티브함을 알아채는 데 약 1.2초. 지나친 뒤 되돌아오는 "landing effect"가 거울상 조건 18.5%(CTA 조건 8%). 대부분 그룹 단위, 미묘한 동작→과장된 동작으로 수 초~수 분 확대 | 폰 참여형이라도 **대형 화면에 '나'가 즉시 등장**하는 미러/실루엣 어트랙트를 섞을 것. 스크린 지나친 뒤 돌아올 공간 확보 | CHI'12 Best Paper, DOI 10.1145/2207676.2207718, http://www.florian-alt.org/academic/project/looking-glass/ — A |
| 4-phase framework (Vogel & Balakrishnan) | Ambient Display → Implicit Interaction → Subtle Interaction → Personal Interaction, 거리에 따른 유동적 전이. Subtle 단계는 약 1분, 팔 길이 밖에서 간단한 손동작. 설계 원칙: Calm aesthetics, 즉각적 사용성, 짧은 지속시간의 유동적 상호작용, 공유 사용, 공개/개인 정보 결합, 프라이버시 | 폰 연결(개인 단계) 전에 "0초 비용" 암묵·미묘 단계를 반드시 둘 것. 걸어 나가면 자동 종료 | UIST'04 (2004-10) https://www.dgp.toronto.edu/papers/dvogel_UIST2004.pdf — A |

### 1.2 폰↔공공 디스플레이 연결 기법 연구 (Alt/Schmidt/Baldauf 계열)

| 연구 | 설계·결과 수치 | 함의 | 출처 |
|---|---|---|---|
| Digifieds (Alt, Shirazi, Kubitza, Schmidt) — 디스플레이 터치 vs 폰 vs QR vs 종이 | 실험실 n=20(평균 26.8세). 사용성(SUS)은 **디스플레이 직접 터치가 폰/디스플레이 터치·QR보다 유의하게 높음**. 콘텐츠 생성 시간은 폰 vs 디스플레이 차이 없음. 종이 QR 스캔이 폰 화면 QR보다 빠름(폰 QR은 "디스플레이에서 활성화" 단계가 추가). **무제한 모바일 데이터 사용자는 폰 생성이 230% 빠름**. 젊을수록 폰/QR 성과↑. 폰은 프라이버시(이메일 노출 회피)·"재미(bumping/scanning)" 장점. "flakey"(여러 번 시도해야 하는) 기법은 수용도를 급락시킴 | 폰 참여는 **1회 시도에 성공**해야 하며, 터치형 보조 입력을 병행. 데이터 요금·회원가입 장벽 제거(브라우저 기반) | CHI'13, DOI 10.1145/2470654.2466226, PDF http://www.florian-alt.org/unibw/wp-content/publications/alt2013chi.pdf — A |
| Interactive opinion polls on public displays (Baldauf, Suette, Fröhlich, Lehner) | 공개 터치 / QR 스캔 후 폰 / 원격 웹 URL 3개 투표 채널 × 일반·개인·지역 질문 3종 필드 비교 | 채널별 투표량 수치는 본문 미확보 [미확인]. 설계 비교의 틀로 유용 | MobileHCI'14, DOI 10.1145/2628363.2634222 — A |
| Serendipitous smartphone interaction (Baldauf & Fröhlich) | Touchpad·Pointer·Mini Video·Smart Lens 비교: 터치패드는 느리지만 정확, Mini Video가 드로잉 같은 복합 조작에 최적, 폰 포인팅은 열등. **브라우저 기반 리모컨(앱 설치 없음)이 '우연한' 참여의 유망 경로** | 앱 설치 요구 금지. 드로잉형은 폰 화면에 미니 비디오(화면 미리보기) 제공 | IGI Global chapter, DOI 10.4018/978-1-4666-8583-3.ch011 — A |
| Enhanced engagement through mobile phone interaction (Pattanakimhun et al.) | 폰 연동이 공공 디스플레이 참여를 높인다는 SIGGRAPH Asia 발표 | 본문 미확보 [미확인] | SA'17 MGIA, DOI 10.1145/3132787.3139205 — A |
| QR 사용성 (US Census Bureau) | QR로 설문 접근: 전원 성공, **평균 과제 시간 12.4초**(미경험자 포함). 2017년경 우편 설문 연구(Marlar)에서는 QR 선택 응답자 **4%**에 불과. 2022년 미국 QR 스캔 인구 8,900만(2020 대비 +26%) | 2020년대 QR은 "스캔 자체"보다 **동기·맥락**이 병목. 스캔 후 12초 안에 보상이 와야 함 | RSM2024-05 (2024) https://www2.census.gov/library/working-papers/2024/adrm/cbsm/rsm2024-05.pdf — A |

### 1.3 주의·시선·블라인드니스

| 연구 | 수치/결론 | 출처 |
|---|---|---|
| Huang, Koster, Borchers 2008 | 사람들은 관찰연구 예측보다 더 보지만 **매우 짧은 글랜스, 종종 먼 거리에서** | Pervasive'08, DOI 10.1007/978-3-540-79576-6_14 — A |
| Müller et al. 2009 Display Blindness | 광고 등 "재미없을 것"이라 기대되는 디스플레이는 배너 블라인드니스처럼 무시됨 | DOI 10.1007/978-3-642-01516-8_1 — A |
| Dalton, Collins, Marshall 2015 "Display Blindness?" | 모바일 아이트래킹으로 재검증(쇼핑몰). 글랜스 지속시간 수치는 본문 미확보 [미확인] | CHI'15, DOI 10.1145/2702123.2702150 (PDF https://oro.open.ac.uk/42236/1/pn236-dalton.pdf, 403) — A |
| Parker, Tomitsch, Kay 2018 | 비연구용 상업 디스플레이 현장관찰(세션당 30분, 지나감/봄/상호작용/스마트폰 사용 카운트). 결론: 10년 전 대비 참여 변화, **스마트폰이 경쟁 주의 싱크** | IMWUT 2(2), 2018-06, https://dl.acm.org/doi/10.1145/3214276 — A. 디스플레이별 시선율 수치 [미확인] |
| Kukka et al. 2013 "What makes you click" | 8개 시각 신호 × 8 디스플레이 필드: **텍스트 > 아이콘, 컬러 > 흑백, 정적 > 애니메이션**이 첫 클릭 유도에 효과적. 성별 차이 존재 | CHI'13, DOI 10.1145/2470654.2466225, https://www.jorgegoncalves.com/docs/chi13.pdf — A |
| Kuratomo, Kray, Zempo 2025 (VR 보행 시뮬레이션) | 앞사람 아바타가 그냥 지나가면 고개 돌림 **11.1%**, 디스플레이를 쳐다보면 **16.7%**, 접근·정지하면 **66.7%**. 내용 인지율 0% → 33.3% → 46.7% (n=18) | Frontiers in VR, 2025-12-04, https://www.frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2025.1714725/full — A |

### 1.4 사회적 당혹감·퍼포먼스·그룹

| 연구 | 결론 | 출처 |
|---|---|---|
| Wouters et al. 2016 "Uncovering the Honeypot Effect" | Encounters 설치물 관찰·로그로 Honeypot Model 제시: 단계 전이를 촉발하는 요인, "남을 보는 것" 외의 유인, 자기강화를 제약하는 조건을 시공간 궤적으로 모델화 | DIS'16, https://dl.acm.org/doi/10.1145/2901790.2901796 — A |
| "Jumping on the Bandwagon" (GI 2019) | 사회적 당혹감 공포가 대형 공공 디스플레이 사용의 주요 장벽. **타인의 존재가 소속 욕구·사회적 호기심을 자극해 장벽을 완화** | https://doi.org/10.20380/GI2019.21 — A (저자 미확인) |
| Webber et al. 2015 "Everybody Dance Now" | 공공 인터랙티브 설치물의 참여 vs 퍼포먼스 긴장: 2~4인 소셜 플레이, 당혹감 제한, 관객을 플레이어로 전환하는 설계 권고 | OzCHI'15, DOI 10.1145/2838739.2838801 — A |
| Tomitsch et al. 2014 "Who cares about the Content?" | 콘텐츠 탐색보다 **디스플레이 '자체'와 노는 행동** 다수 — 스켈레톤 거울상이 놀이를 촉발 | PerDis'14, DOI 10.1145/2611009.2611016 — A |
| Valkanova et al. 2014 MyPosition | 몸 위치+손들기로 투표하는 공개 투표: **식별 가능성↑ → 참여·토론↑, 그러나 실제 투표율↓** | CSCW'14, DOI 10.1145/2531602.2531639 — A |
| Steinberger, Foth, Alt 2014 Vote With Your Feet | 하이퍼로컬 발 투표, "초대하는" 느낌·공동 토론 유발 | PerDis'14, DOI 10.1145/2611009.2611015 — A |
| Hosio, Goncalves, Kostakos, Riekki (Oulu 시민참여 챕터) | 터치 디스플레이 시민 피드백 앱: **2,664회 실행 = 전체 앱 사용의 7.2%(36,874회)**, 그중 텍스트 피드백 **3.0%**, 스마일리 평가 **8.0%**. 텍스트의 **66.7~77.1%가 노이즈**(랜덤 문자, 자기과시, 규칙 위반). 그룹 사용이 "많지만 노이즈 많은" 피드백을 만든다. 인터뷰: 공개 상황에서 **부정적·감정적 의견 제출을 꺼림**(Brignull & Rogers 재확인). 권고: "Expect moderate participation", 공개 스크린은 **원격·사적 참여 경로를 광고하는 용도로** | https://ubicomp.oulu.fi/files/displays_chapter.pdf — A |
| Kelly, Ferdous, Wouters, Vetere 2019 | 폰 AR(화면이 개인 폰에 있음)이 허니팟을 유발하는가를 검증 — 폰 기반 참여는 **타인에게 '보이지 않는' 상호작용**이라 허니팟이 약화될 위험을 제기 | CHI'19, https://dl.acm.org/doi/10.1145/3290605.3300515 — A (결과 수치 [미확인]) |

**연령·그룹 관련 수치**: Alt 2013(젊을수록 폰 기법 성과↑), Looking Glass(대부분 그룹), Hosio(그룹=노이즈↑), Müller 2010(여가 동선↑). 아동·청소년 vs 성인의 **정량 비교 필드 데이터는 확보 실패** [미확인] — Tomitsch 2014·Mast et al. 2023(DIS, 박물관 놀이형 전시 참여 패턴, DOI 10.1145/3563657.3595985)이 후보.

**참여율의 현실적 기준선(학술+1차 데이터 종합)**: 공공 디스플레이 앞 "전체 행인 → 실제 상호작용"은 한 자릿수 %가 일반적이며(Hosio: 앱 실행 중 3~8%만 기여, Müller 2010: 단계마다 다수 이탈), 폰 스캔은 더 낮다(Census/Marlar: 종이 초대장 QR 선택 4%; 영국 대학도서관 QR 관찰연구 "입장 7,356명 중 접근 0.79%, 스캔 0.30%"는 검색 요약에서만 확인, 원문 URL [미확인]).

---

## 2. 업계 가이드라인

### 2.1 주의(attention)·체류 데이터

| 출처 | 수치 | 함의 | 등급 |
|---|---|---|---|
| Lumen × JCDecaux·Clear Channel·Exterion·APG, AM4DOOH 백서(2018; Lumen 게시 2017-05-01) https://outdoorimpact.no/wp-content/uploads/2019/08/AM4DOOH-Whitepaper-2018.pdf , https://lumen-research.com/white-papers/study-with-jcdecaux-clear-channel-exterion-and-apg-the-reality-of-attention-to-dooh/ | 영국·프랑스·스위스·스웨덴 n=468, VR+아이트래킹. 운전자가 **정적 종이 포스터를 볼 확률 40%, 정적 디지털 51%, 풀모션 55%(+35%)**. 풀모션의 LTS(look-to-see)는 정적 대비 운전자 +25%, 보행자 +16%, "종이 대비 1/3 더 주목". 전형적 루프 = 광고 6개 × 10초. 보행자는 "보이자마자" 보지만 운전자는 통과 직전에 몰아서 봄 | 참여형 콘텐츠는 **10초 슬롯 루프**가 아니라 전용 상시 슬롯이 필요. 풀모션은 기본 | A/B |
| Ocean Outdoor × Lumen, The Attention Dividend (2025-06-11) https://oceanoutdoor.com/the-attention-dividend/ | 프리미엄 대형 DOOH 평균 **시청 3.9초**, 표준 OOH의 3배, 온라인 디지털의 5배. 풀모션 = 정적 대비 브랜드 선택 2.5배, 3D(DeepScreen) 3배 | "3.9초 안에 참여 제안을 이해시켜야" 한다는 현실적 상한 | B |
| Sixteen:Nine, "How much time do displays really have with viewers?" (2016-06-23) https://invidis.com/sixteen-nine/2016/06/23/how-much-time-do-digital-signage-displays-really-have-with-viewers/ | 안면인식 분석 평균 **약 4초, 최대 7초**; 플랫폼 로그 평균 4초 미만; 2005 캐나다 OOH 연구 글랜스 200ms. 결론: **1.5~3초 안에 메시지**, 레이아웃 존은 "하나 이상이면 과함"(Haynes) | 참여 CTA는 1존·1문장 | B |
| JCDecaux UK "Perfect Poster" (2025, System1+Lumen, 1,000+ 캠페인) https://www.jcdecaux.co.uk/perfect-poster | 3스타 이상 크리에이티브는 상업 성과 2배, 잘 브랜딩된 광고는 회상 54%↑, 브랜드 자산 정렬 시 회상 2배. 세부 가이드는 다운로드 전용 | 스폰서 노출은 "브랜드 자산"으로 통합 | B |
| OAAA Creative Guidelines https://oaaa.org/resources/creative-guidelines/ | 회원 전용(열람 불가) | — | A(접근 불가) |

### 2.2 크리에이티브 규칙(단어 수·초·대비)

| 출처 | 규칙 | 등급 |
|---|---|---|
| Outfront, Creative Best Practices https://www.outfront.com/resources/creative-best-practices | **"약 7단어 이하"가 OOH 관행**; 글자 기준 72px(≈1.5인치); 대비 유지; 애니메이션은 핵심 정보 강조에만; 로고는 끝에 **3초** 홀드 | A(공식) |
| Clear Channel Outdoor, Creative Solutions https://clearchanneloutdoor.com/creative-solutions/ | "실루엣+대담한 색으로 호기심" 등 8대 원칙; **Social Amplification: "소비자에게 15초의 명성(15 seconds of fame)"** — SNS 포스트를 스크린에 통합 | A(공식) |
| Sixteen:Nine 2016(위) | 1.5~3초 훅, 1존 | B |
| "2초 룰" | 공식 문서에서 문구 자체는 확인 실패 [미확인]. 실질 근거: Lumen 3.9초 평균, Haynes 1.5~3초, Looking Glass 1.2초(인터랙티브 인지) | — |

### 2.3 QR 전용 가이드 & 스캔 벤치마크

| 출처 | 내용 | 등급 |
|---|---|---|
| OAAA × Intersection, "The QR Code Comeback: 5 Tips" (2021-01-27) https://oaaa.org/blog-posts/the-qr-code-comeback-5-tips-for-out-of-home-designers/ | ① **55인치 화면에서 QR 250~300px(6.25~7.5인치) → 4~7피트(1.2~2.1m)에서 스캔**, 더 멀면 "가까이 오세요" 유도 ② 눈높이: 바닥 53인치 높이 화면은 **상단 1/3에 QR 금지** ③ 원거리용은 **화면당 QR 1개**(여러 개면 카메라 초점이 튐) ④ 팔 길이 거리 인터랙티브는 120~150px(3~3.75인치) 2~3개 가능, 여백·대비 확보 ⑤ **슬롯 전체 시간 동안 QR 노출**(대부분 15초 이하 슬롯) — 알아채고·결정하고·스캔할 시간 필요. 인용: Statista 2020-09 "47%가 QR 사용 증가 체감", Nielsen OOH→검색 46%·웹 방문 38% | A/B |
| OAAA "The Power and Caution of QR Codes in OOH Media" https://oaaa.org/blog-posts/the-power-and-caution-of-qr-codes-in-ooh-media/ | 회원 전용 [미확인] | — |
| Lamar(미국 최대 로드사이드) 프로그래매틱 FAQ — doohmarketing.com 인용 https://doohmarketing.com/tips/qr-codes | **"QR 코드는 빌보드에 표시할 수 없다"**, 운전자 대상이 아닌 트랜짓·거리 레벨 매체에서만 허용. Ströer(뮌헨 DOOH) 금지, 두바이 시 전통 포맷 금지 | B(2차 인용, 원문 [미확인]) |
| doohmarketing.com(Goldfish Ads, 2026) 위 URL | **10:1 룰**(스캔 거리 ≈ 코드 크기의 10배): 고속도로 14×48ft 벌보드는 250~500ft 거리 → 코드 25~50ft 필요 = 불가. 체육관·엘리베이터·계산대(3~6ft)만 현실적. 디스플레이 배너 CTR 0.046~0.1% vs DOOH QR은 "백만 노출당 한 자릿수 스캔"(모델 추정). **"신뢰할 독립 DOOH QR 스캔 벤치마크는 존재하지 않음"**, 벤더의 12~18%·2.8x 주장은 방법론 미공개. "5개 관문": 15초+ 체류·10ft 이내 정지 관객, 매체사 서면 허가, 즉시 보상(할인·티켓, "learn more" 금지), 1단계 랜딩(<4초 로드), 바닐라 URL 대조군 측정 | C/B |
| Sixteen:Nine (2012-01-05) https://invidis.com/sixteen-nine/2012/01/05/qr-codes-still-a-mystery-to-most-even-those-who-do-scan/ | Chadwick Martin Bailey: QR 인지 21%, 그림 보여주면 81% 재인. Russell Herder(2011-10): 72% 본 적 있음, 30%는 뭔지 모름; 스캔자의 57%는 아무것도 안 함. **스캔 출처: 잡지·신문 35% vs 빌보드·사인 11%**. Haynes: "디지털 옥외의 시청 상황은 폰을 꺼내기에 좋지 않다" | B |
| Sixteen:Nine (2013-01-03) https://invidis.com/sixteen-nine/2013/01/03/research-insist-qr-codes-product-information/ | PRS n=1,450: 스캔 목적 제품정보 69%·프로모션 65%·가격비교 57%; 남 75% vs 여 52% 비보조 인지. "그래서 더는 빌보드·TV·사이니지에서 QR을 보지 않는다" | B |
| OAAA × Harris Poll, OOH Amplification (2024-11, n=1,661 성인 18~64) [PDF 확보, URL 미확인; oaaa.org 리소스센터] | OOH 광고에서 **QR 코드 본 기억 47%**, **QR 스캔 후 SNS 페이지 이동 경험 43%**, 소셜 콘테스트 참여 유도 기억 33%; "소셜 요소가 있으면 온라인 참여 의향↑" 52%(밀레니얼 63%) | B(자기보고) |
| OAAA × Harris Poll DOOH 팩트시트(조사 2024-04-02~09, n=1,023) [URL 미확인] | 모바일 사용자 **74%가 DOOH 노출 후 기기 행동**: 검색 44%, 웹 38%, SNS 30%, **QR·탭·문자 등으로 정보/쿠폰 접근 24%** | B |
| OAAA × Harris Poll Early 2022(조사 2021-10-20~25) https://oaaa.org/resources/the-harris-poll-ooh-consumer-insights-intent-q1-2022/ | **48%**: NFC·QR·SMS로 상호작용할 수 있는 OOH 광고 브랜드를 선호 | B |
| OAAA, Nielsen DOOH study (2020-08-03) https://oaaa.org/blog-posts/nielsen-research-dooh-engages-consumers-and-drives-activations/ | DOOH 시청자 약 2/3가 측정 행동 1개 이상, 절반 이상이 모바일 행동(빌보드 52%, 스트리트퍼니처 62%, 트랜짓 ~60%, 플레이스베이스드 54%) | B |
| Grand Visual https://grandvisual.com/ | "인터랙티브 OOH는 정적 대비 **최대 4배 긴 체류**"(Nielsen 2017 인용), "인터랙티브 콘텐츠는 전환 2배"(Kapost 인용) | B/C |
| Bitly, State of QR Code Scans 2026 (2026-03-10) https://bitly.com/blog/state-of-qr-code-scans-2026/ | 2024→2025 스캔 성장: 유럽 +42%, 북미 +8%, **아태 +21%**; 스캔 증가(20~50%+)가 코드 생성 증가(0.5~7%)를 상회 → "QR 피로" 반증 | B(벤더 데이터) |
| Uniqode QR Benchmark Tool https://www.uniqode.com/unique-angles/qr-code-benchmark-tool | 1.88억 스캔·79.6만 코드 기반, 배치별(이벤트·공항/역·광고) 벤치마크 — 수치는 설문 후 공개 | C |

**환경별 벤치마크 결론**: 트랜짓/몰/스타디움/스트리트 각각의 공개된 **독립 스캔율 벤치마크는 없다**(doohmarketing 2026 명시). 가용 근거의 방향성은 일치 — 로드사이드는 불가(Lamar 정책·10:1 물리), 체류형(역 플랫폼·몰·경기장 좌석·대기열)만 유효. 경기장 벤더(Promo On Demand)는 "20,000명 중 10% 스캔" 같은 **가상 계산**만 제시하고, QR 최소 30초·최적 45~60초 노출, 카운트다운 병행을 권고(실측 아님) https://www.enpromolive.com/resource_center/documentation/jumbotron-live-events.php — C.

---

## 3. 실무자·커뮤니티 의견 (압수수색)

### 3.1 Dave Haynes / Sixteen:Nine 10년 궤적(아카이브는 invidis.com으로 이전)

| 날짜 | 포스트 | 입장·인용 | URL |
|---|---|---|---|
| 2012-01-05 | QR Codes Still A Mystery To Most | "디지털 옥외 시청 상황의 역학은 사람들이 폰을 꺼내기에 그리 좋지 않다(aren't terribly conducive to people whipping out their phones)" | https://invidis.com/sixteen-nine/2012/01/05/qr-codes-still-a-mystery-to-most-even-those-who-do-scan/ |
| 2013-01-03 | If You Insist On QR Codes… | 2011~12년 이후 "제대로" 쓰이기 시작 — "빌보드·TV·사이니지에서는 사라지고 매장 가격표에만" | https://invidis.com/sixteen-nine/2013/01/03/research-insist-qr-codes-product-information/ |
| 2014-09-26 | Interactive Ad Pods in Bangalore | 제스처형 DOOH = **"Stupid People Tricks"**. "**당황스러울 수 있는 것을 시도하려는 사람의 수를 제한하는 역학이 있다**" / "제스처가 참신함 때문인지, 최선의 방식이라서인지" | https://invidis.com/sixteen-nine/2014/09/26/projects-interactive-ad-pods-in-bangalore/ |
| 2016-06-23 | How Much Time… | 평균 ~4초·최대 7초, 1.5~3초 훅, 1존 | (2.1 참조) |
| 2017-10-26 | No More Stupid People Tricks: Microsoft Kills Off Kinect | 스포츠 매장 Kinect 설치는 "멈추거나 방치"; "**걸어가서 터치스크린이나 버튼을 누르는 게 기하급수적으로 더 말이 된다**"; "그리 아쉽지 않을 노벨티 기술" | https://invidis.com/sixteen-nine/2017/10/26/no-more-stupid-people-tricks-microsoft-kills-off-kinect/ |
| 2021-04-22 | Submarine Takes Slow Dive… (영국 해군 모병, Ocean 시선분석으로 5초 응시 시 잠수함 하강) | 과거 "DOOH 빌보드에 QR을 넣는 것의 미심쩍은 가치에 대한 농담이 많았다", 팬데믹 이후 "**QR 부활기**"; 과거 "고속도로 빌보드 300피트 거리의 QR" 비판 | https://invidis.com/sixteen-nine/2021/04/22/submarine-takes-slow-dive-based-on-viewers-of-those-uk-digital-billboard/ |

종합: Haynes의 일관된 입장은 ① 공개 장소에서 **몸을 쓰는 상호작용은 당혹감 때문에 참여자 풀이 작다**, ② 인터랙티브는 "참신함"이 아니라 "최선의 방식"일 때만, ③ QR은 **체류·근접 환경에서만** 성립(2020년 이후 QR 자체의 수용성은 올라감). 등급 B.

### 3.2 해외 실무·벤더(검색 가능 범위)

- doohmarketing.com(Goldfish Ads, 2026): "QR 대신 바닐라 URL·검색어 프롬프트·SMS 숏코드"를 권하고, QR을 쓰려면 5개 관문을 통과하라(2.3 참조) — C/B.
- Clear Channel: "15 seconds of fame" 소셜 앰플리피케이션(사용자 포스트를 스크린에) — A(공식) https://clearchanneloutdoor.com/creative-solutions/
- Coinbase 슈퍼볼 LVI(2022-02-13) 튀는 QR 60초: **1분 만에 2,000만+ 랜딩 접속**(CPO Surojit Chatterjee 발언, ppc.land https://ppc.land/second-screen/ ; 자사 블로그 CMO Kate Rouch 인터뷰 인용 다수) → "TV·대형 스크린 QR이 '동시 다수'에게는 작동"하지만 **잠깐의 접속 폭주로 앱 다운**이라는 운영 교훈 — B/C.
- 경기장 벤더(Daktronics LiveWrx: 모바일 참여형 비디오보드 게임 https://www.daktronics.com/en-us/products/software-and-controllers/livewrx ; Promo On Demand: 노출 45~60초+카운트다운) — 실제 참여율 공개 없음 — C.
- Reddit(r/digitalsignage, r/TouchDesigner, r/advertising, r/experientialmarketing)·LinkedIn·Medium 원문: **네트워크 차단으로 수집 실패** [미확인]. 9절에 추적 쿼리 제시.

### 3.3 한국 실무자·커뮤니티(네이버 블로그·업계 매거진·언론)

| 출처 | 요지 | 등급 |
|---|---|---|
| 에이플랜컴퍼니 블로그 (2026-06-23) https://blog.naver.com/aplan-company/224320724295 | "중요한 질문은 '무엇을 움직이게 할 것인가'가 아니라 **'관객이 왜 움직이고 싶어지는가'**." 리얼타임 트래킹·터치·사운드 반응·AI 인터랙티브 4유형. 포토스팟 기능 강조 | C |
| 스위트앤데이터 (2026-06-14) https://blog.naver.com/smitz/224315700671 | "보는 전시→참여하는 경험"; 참여한 순간이 기억에 남음; 생성형 AI로 "사람마다 다른 장면" 개인화 | C |
| 코드스토리 (2026-03-09) https://blog.naver.com/codestory_biz/224206881823 | 미디어아트 전시 인기 요인: 공간 전체가 콘텐츠, **사진·영상이 잘 나와 SNS 공유→자연 홍보** | C |
| 더그림미디어 매거진 (2025-01) https://www.thegreammedia.com/magazine/12 | 모션 센싱·터치·라이브 스케치(관객 그림→애니메이션) 3유형, 턴키 운영 | C |
| LG U+ 일상비일상의틈 (EBN 2026-09-16) https://www.ebn.co.kr/news/articleView.html?idxno=1724437 | 6년 누적 **190만 명**, 70% 이상 비고객. 운영 KPI를 방문자 수가 아닌 **체류시간·몰입도·재방문 의향·추천 의향**으로 관리. 숏츠 런웨이(촬영→AI 편집), AI 아트메이트 | B |
| 미디어파사드 민원·예산 논란: 목포MBC "미디어파사드에 83억? 명백한 예산 낭비" https://www.usmbc.co.kr/article/lPrL3cai0j0yEWn81HBe ; 경기신문 "'빛공해 주범' 미디어파사드" https://www.kgnews.co.kr/news/article.html?no=817744 ; 매일신문 (2025-01-14) 효목고가도로 13억 미디어파사드 "어지럽고 운전만 방해" https://www.imaeil.com/page/view/2025011417360273751 | 국내 공공 미디어파사드의 리스크는 **참여율 이전에 빛공해·운전 방해·예산 민원**. 운영 설계에 "밝기·시간대·주민 설명회"가 선행 | B |
| 대구 동성로 디지털 전광판 규제 완화 '미디어 스트리트' (뉴시스 2026-02-09) https://www.newsis.com/view/NISX20260209_0003508432 | 보행자 전용 거리의 옥외광고물 특정구역 지정 → 참여형 콘텐츠의 "보행자·체류" 입지가 제도적으로 열리는 중 | B |

국내 **참여율·운영 인력 수치를 공개한 실무자 글은 발견하지 못했다** [미확인]. 국내 학술은 RISS에서 "미디어파사드에서 다중 모바일 기기를 활용한 인터랙티브 환경에 관한 연구"(명보아트홀 투명 디스플레이, 다수 관객 모바일 상호작용 구현; 연도·저자 미확인), KoreaScience에서 VR 틸트브러시 스트로크를 미디어파사드로 공연에 투사한 연구(봉산탈춤; 미확인)가 검색됨 — 둘 다 구현 중심이며 참여율 데이터는 없음.

---

## 4. 참여 유도 설계 원칙 체크리스트 (우선순위순, 근거 포함)

| # | 원칙 | 구체 기준 | 근거 |
|---|---|---|---|
| 1 | **0초 비용의 암묵 단계 → 폰은 '두 번째' 단계** | 지나가기만 해도 화면이 반응(거울상/실루엣/군중 카운트). 폰 연결은 이미 멈춘 사람에게만 제안 | Vogel & Balakrishnan 2004 4단계; Looking Glass +90%/+47%; Müller 2010 funnel |
| 2 | **1.2~3초 훅** | 첫 3초 안에 "이게 반응한다"가 보여야 함. 텍스트 1문장·1존 | Looking Glass 1.2초; Haynes 2016 1.5~3초; Ocean/Lumen 3.9초 |
| 3 | **즉각·가시적 피드백이 최우선 동기** | 폰 입력 후 **대형 화면 반영 지연 목표 ≤1초(체감 즉시)**, 늦어도 QR 스캔→보상 12초 이내 | Müller 2010 "자기 행동의 결과를 보는 것이 가장 중요"; Census 2024 QR 12.4초 |
| 4 | **허니팟을 설계로 제조** | 오픈 시 스태프/지인 시드, 참여자가 화면과 함께 보이는 위치(관객이 "사람+화면"을 동시에 볼 수 있게), 줄 설 공간 | Brignull & Rogers 2003; Looking Glass; Kuratomo 2025 (접근 모델이 고개 돌림 66.7%) |
| 5 | **폰 참여를 '보이게'** | 폰만 보는 참여(앱 내 AR)는 허니팟을 죽임 → 폰 입력의 결과를 반드시 대형 화면에 노출 | Kelly et al. 2019; Haynes 2017 |
| 6 | **당혹감 비용 최소화: 몸보다 엄지** | 큰 제스처·춤 요구 금지(옵션으로만). 터치/버튼/폰 탭이 기본 | Haynes 2014·2017; GI 2019; Webber 2015 |
| 7 | **그룹 플레이 기본값** | 2~4인 협동/대결 모드, 혼자도 가능하되 그룹 보너스 | Looking Glass(대부분 그룹); Webber 2015; Hosio(그룹↑ 단, 노이즈↑) |
| 8 | **낮은 첫 커밋먼트** | 첫 액션 = 탭 1회(투표·색 고르기). 입력·회원가입·앱 설치 금지, 브라우저 기반 | Alt 2013("flakey" 치명); Baldauf & Fröhlich(브라우저 리모컨) |
| 9 | **1회 성공 보장** | QR 1개/화면, 눈높이, 55"에서 6.25~7.5인치, 전 슬롯 노출, 랜딩 <4초, 오프라인 폴백(숏URL·NFC) | OAAA/Intersection 2021; doohmarketing 10:1 |
| 10 | **입지 = 체류형·여가 동선** | 역 플랫폼·광장·몰 아트리움·경기장 좌석. 로드사이드/통행로 한가운데 금지 | Lamar 정책; Müller 2010(통행 방해→이탈, 여가 목적↑); AM4DOOH |
| 11 | **익명 기본 + 식별은 선택** | 익명이 투표율↑, 이름 공개는 토론↑·투표율↓ → 두 모드 분리 | MyPosition 2014; Hosio(부정 의견 공개 꺼림) |
| 12 | **타임박스 라운드 + 카운트다운** | 30~60초 라운드, 화면에 남은 시간 표시 → 결정 지연 차단, 회전율↑ | Promo On Demand(벤더 권고, C); Vogel 2004 subtle ≈1분 |
| 13 | **사회적 증거를 화면에** | "지금 N명 참여 중", 최근 참여 결과 스트림, 리더보드 | Hosio(메시지 스트림 도입 후 텍스트 참여 증가, 커뮤니티감); Honeypot |
| 14 | **창발적 목표(샌드박스)** | 정답 하나가 아니라 "내가 만든 것"이 남는 구조(드로잉·조합) | Müller 2010 emergent goals; Tomitsch 2014 |
| 15 | **포스터처럼 보이지 말 것** | 광고 레이아웃·브랜드 과잉 → display blindness. 스폰서는 "브랜드 자산"으로 통합 | Müller 2009; JCDecaux Perfect Poster |
| 16 | **첫 클릭 유도 신호** | 텍스트 CTA > 아이콘, 컬러 > 흑백, **정적 > 애니메이션**(어트랙트 루프 과잉 금지) | Kukka 2013 |
| 17 | **보상은 즉시·확정·가시** | "참여하면 당신의 메시지/그림이 지금 저기 뜬다" 수준의 확정 보상. "learn more"형 금지. 경품 추첨은 보조 | doohmarketing 5관문; OAAA/Harris 48% 상호작용 선호 |
| 18 | **경품 메커닉의 법적·행동적 주의** | 국내 경품은 표시광고법·경품고시, 개인정보 수집 최소화(참여 자체에 연락처 요구 금지). 경품은 "트롤 유입"도 키움 | Dub the Dew(5절); [법령 세부 미확인] |
| 19 | **실패 모드 설계** | 혼자 서 있는 상황·대기열 0명 상황에서도 화면이 "비어 보이지 않게"(봇/과거 기록 재생) | Müller 2010(주의 경쟁); Looking Glass landing effect |
| 20 | **접근성** | 휠체어 높이 터치 대안, 색약 대비, 자막, 폰 참여 경로가 접근성 폴백이 됨 | Vogel 2004 shared use; Outfront 대비 규정 |
| 21 | **모더레이션 비용을 포맷에서 줄이기** | 자유 텍스트 대신 선택지·스티커·사전 승인 어휘; 자유 입력은 지연 송출+필터 | Hosio 노이즈 67~77%; 5절 사례 |
| 22 | **측정 체계** | 퍼널 KPI: 통과자→시선→정지→폰 연결→완료→재참여; 대조군(QR vs URL) | Michelis & Müller 2011; doohmarketing 관문 5 |
| 23 | **운영 공해 관리** | 밝기·소음·시간대·주민 설명 선행(국내 미디어파사드 민원 패턴) | 3.3 국내 언론 |

---

## 5. UGC 공개 송출의 리스크 사례

| 사례 | 날짜 | 무슨 일이 | 결과·대응 → 교훈 | 출처·등급 |
|---|---|---|---|---|
| Mountain Dew "Dub the Dew" | 2012-08-13 | 신제품 이름 공모 투표를 4chan이 급습 — "Hitler did nothing wrong"이 1위, "Diabeetus", "Gushing Granny" 등. 사이트도 해킹(9/11 메시지·릭롤) | 페이지 폐쇄, 트위터로 "인터넷에 졌다" 인정, "지역 고객 프로그램"으로 선 긋기 → **무제한 자유 입력+공개 순위**는 급습 표적 | https://knowyourmeme.com/memes/events/dub-the-dew (Gawker·AdWeek·Mashable 보도 정리) — C/B |
| Coca-Cola #MakeItHappy | 2015-02 | 부정적 트윗을 ASCII 아트로 바꾸는 자동화 캠페인. Gawker가 @MeinCoke 봇으로 『나의 투쟁』 구절을 주입 → 코카콜라 계정이 히틀러 텍스트를 송출 | 캠페인 중단(Guardian 2015-02-05 보도) → **자동 변환 파이프라인은 입력 검열 없이는 무기화** | https://en.wikipedia.org/wiki/Personalized_marketing — B |
| Boaty McBoatface (NERC #NameOurShip) | 2016-03~2016-10 | 2억 파운드 극지 연구선 이름 공모에서 'Boaty McBoatface'가 33%로 압승(2위 11%) | 장관이 RRS Sir David Attenborough로 결정, 잠수정에만 Boaty 명명. "McBoatfacing(=인터넷에 결정을 맡기는 실수)" 신조어 → **공모는 '추천'으로, 최종 결정권 유보 조항 명시** | https://en.wikipedia.org/wiki/Boaty_McBoatface — B |
| Walkers "#WalkersWave" (Gary Lineker 셀피 캠페인) | 2017-05 | 셀피를 트윗하면 리네커 영상에 합성해 공개(챔피언스리그 결승 티켓 경품). 트롤이 연쇄살인범·성범죄자 사진 제출 → 합성 영상이 자동 송출 | 캠페인 철회·사과 → **이미지 UGC는 사전 검수 없이는 자동 합성 금지** | 영국 언론 보도(BBC/Guardian 2017-05-25) 다수이나 본 세션에서 원문 URL 확보 실패 [미확인]. Wikipedia Walkers·Lineker 항목에도 미기재 |
| Coinbase 슈퍼볼 QR | 2022-02-13 | 1분 2,000만+ 접속으로 앱 다운 | 성공 사례지만 **동시 접속 설계 미비** 교훈 | https://ppc.land/second-screen/ — B/C |
| 여수 버스정류장 BIS 전광판 음란 동영상 | 2016-04-26 | 버스정보 안내 전광판에 약 1시간 음란물 송출, 해킹 추정, 직원 퇴근 후 무방비·원격제어 기능 노출 | 원격제어 차단 → **운영 시간 외 원격 접근 통제·화이트리스트** | YTN http://www.ytn.co.kr/_ln/0103_201604261930125784 ; 아시아경제 http://view.asiae.co.kr/news/view.htm?idxno=2016042610454977468 — B |
| 식당 전광판 해킹(윤석열 이미지+욕설 송출) | 판결 2025-05-28 | 30대가 식당 전광판을 해킹해 대통령 이미지와 "참고 살아 개돼지들아" 송출 | 벌금 500만 원 → 국내에서도 **일반 전광판의 외부 송출 경로가 공격면** | 연합뉴스TV http://www.yonhapnewstv.co.kr/AKR20250528090137741 ; 머니S https://www.moneys.co.kr/article/2025052810244139839 — B |
| 지자체 참여형 메시지 전광판 사고(국내) | — | 시민 메시지·소원 송출형 사고 사례는 네이버 뉴스 검색에서 확인 못함 | [미확인] — 홍성군 마늘 홍보영상 선정성 논란(2022-11)처럼 **공공 콘텐츠 자체의 검수 실패**는 존재 (http://www.ikpnews.net/news/articleView.html?idxno=48289) | B |
| 국내 완화 장치 | 2026-05 | 명동 전광판 앱 예약 플랫폼(Drafttype)이 **옥외광고법 학습 AI로 소재 사전 검수** 자동화 | 팬덤 생일광고 등 개인 송출 증가에 맞춘 **자동 사전심의**가 국내 표준으로 등장 | 디지털데일리 2026-05-13 https://www.ddaily.co.kr/page/view/2026051311194186590 — B |

**설계 규칙으로 번역**: ① 자유 텍스트·이미지는 "지연 송출 + 자동 필터(욕설·혐오·개인정보·얼굴/유명인 탐지) + 샘플링 인간 검수" 3중, ② 순위·명명형은 "최종 결정권 유보·후보군 사전 큐레이션", ③ 자동 합성(얼굴 합성·텍스트 변환)은 사전 검수 통과분만, ④ 송출 시스템은 운영 시간 외 원격 접속 차단·송출 로그 보존, ⑤ 급습(브리게이딩) 감지 — 단시간 동일 패턴 급증 시 자동 '선택지 모드' 전환.

---

## 6. 한국 특수성

| 항목 | 사실·수치 | 설계 함의 | 출처·등급 |
|---|---|---|---|
| QR 체크인 경험 | 전자출입명부(QR) 2020-06 도입 → 방역패스 종료에 맞춰 **2022-03-01 중단**. 카카오 플랫폼 경유 코로나 공공서비스 연결 **43억 회+**(비대면 수업·QR체크인·백신예약 포함, 2020-01~2022-04), **네이버 QR체크인 이용자 2,800만 명**. 2020-10 시점 QR 이용건수 2억 건 돌파 보도 | 국내 성인 대부분이 **"공공장소에서 QR을 꺼내는 행동"을 2년간 학습** — 스캔 자체의 심리적 장벽은 해외보다 낮다고 볼 근거. 단, "체크인=의무"의 피로 연상 가능 | 머니투데이 2022-03-06 https://www.mt.co.kr/tech/2022/03/06/2022030416463755422 ; 서울경제 2022-06-12 https://www.sedaily.com/NewsView/2677UBUYF1 ; 머니투데이 2020-10-22 http://news.mt.co.kr/mtview.php?no=2020102213594271831 — B |
| 스마트폰 보급 | 성인 보급률 **97%**(한국갤럽, 2022-07 기준) | 폰 참여 전제 성립. 고령층은 70대 이상 여성 31% 미사용(2022 보도) → 비폰 폴백 필요 | 전자신문 2025-09-29 https://www.etnews.com/20250929000454 ; 연합뉴스 2022-07-06 https://www.yna.co.kr/view/AKR20220706166600017 — B |
| 5G | 최신 가입자 수치 확보 실패 [미확인] (과기정통부 '무선통신서비스 가입 현황' 월별 통계 https://www.msit.go.kr/bbs/list.do?sCode=user&mId=99&mPid=74 또는 ITSTAT에서 확인 권장) | 체류형 공간에서 동시 접속 수천 명 수준은 네트워크보다 **백엔드 동시성**이 병목(코인베이스 교훈) | — |
| 간편결제/QR 결제 생활화 | 한국은행 2026 상반기: 지급카드 일평균 3조 7,770억 원, **간편결제 일평균 9,410억 원(+10.6%)**, 비대면 결제 47.4% vs 실물카드 37.7% | 카메라 앱 자동 인식·페이 앱 QR이 일상 → QR 안내 문구를 "카메라를 비추세요" 수준으로 단순화 가능 | kpenews https://kpenews.com/View.aspx?No=4246190 — B |
| 팬덤·단체 응원 문화 | 명동·서울역 등에서 **K-pop 팬덤 생일·컴백 광고가 급성장**(앱으로 전광판 예약, AI 사전심의); 엔하이픈 희승 생일 광고가 서울역 111m 파노라마 전광판 송출; 카카오모빌리티 DAY6 10주년 캠페인(2025-08-22~09-05): 전국 약 **2만 개 디지털 스크린(지하철·공항·주차장·택시)의 QR로 축하 메시지 접수 → 9-05 서울역 '서울 파노라마' 미디어파사드에 집계 송출**; 2026 월드컵 광화문 등 초대형 전광판 거리응원 부활 | 한국은 "수줍은 개인"과 "**집단·팬덤의 폭발적 참여**"가 공존 — 익명 개인 참여보다 **팬덤·응원 단위의 집단 메시지**가 가장 검증된 참여 동력. 참여 수치는 미공개 | 디지털데일리 2026-05-13 https://www.ddaily.co.kr/page/view/2026051311194186590 ; 뉴스1 https://www.news1.kr/industry/general-industry/5941377 ; 데일리안 https://www.dailian.co.kr/news/view/1545710/ ; 쿠키뉴스 2026-06-25 https://www.kukinews.com/article/view/kuk202606250130 (본문 접근 차단) — B |
| 공공 체면·당혹감 | 국내 정량 연구 미확보 [미확인]. 해외 연구(GI 2019, Haynes)의 "혼자 몸 쓰는 참여 기피"는 한국의 집단주의 맥락에서 더 강하게 작동할 가능성 — 가설 | 1인 노출형 대신 "무리 속 익명 1표"·"팬덤 이름으로 참여" 모드 | 가설(근거 없음) |
| 참여형 전시 운영 데이터 | LG U+ 일상비일상의틈 6년 190만 명, KPI=체류·몰입·재방문·추천(6절 3.3) ; 서울라이트 DDP 2020 시민 사진·AI 활용(접수 건수 미공개) | 국내 운영사도 **참여율보다 체류·재방문**을 지표로 — 제품 KPI 설계 시 참고 | EBN 2026-09-16 ; 뉴스1 2020 https://www.news1.kr/articles/?4105249 — B |
| 규제·민원 | 옥외광고물법상 특정구역 지정(대구 동성로 미디어스트리트, 2026-02), 미디어파사드 빛공해·운전방해 민원(3.3) | 보행자 전용 구역·실내 아트리움·역사(驛舍)가 제도·민원 양면에서 유리 | 뉴시스 2026-02-09 — B |

---

## 7. 포맷별 참여 메커니즘 평가

척도: 허들(낮음=좋음) / 대중 재미 / 모더레이션 부담(낮음=좋음) / 반복 소비 / 스폰서 적합성 — 상·중·하

| 포맷 | 참여 허들 | 대중 재미 | 모더레이션 부담 | 반복 소비 | 스폰서 적합 | 근거·사례 |
|---|---|---|---|---|---|---|
| 투표/퀴즈 (탭 1회) | 하 | 중 | 하 | 중(문항 교체) | 상 | MyPosition(식별↑→투표↓, 익명 권장); Vote With Your Feet; Hosio(스마일리 8% vs 텍스트 3%, 단 스마일리는 신뢰도 낮음) |
| 협업 드로잉/픽셀 캔버스 | 중(폰 미니뷰 필요) | 상 | 중(낙서·혐오 도형) | 상(캔버스가 자산) | 중 | Baldauf & Fröhlich(Mini Video가 드로잉 최적); Müller 2010 창발 목표; 더그림 "라이브 스케치" |
| 대규모 미니게임(퐁·레이싱·리듬) | 중 | 상 | 하 | 중 | 상 | Looking Glass(그룹·확대 동작); Webber 2015(2~4인); 지연 ≤1초 필수(원칙 3); Daktronics LiveWrx(C) |
| 메시지·소원 벽(자유 텍스트) | 하 | 중 | **상** | 중 | 중 | Hosio 노이즈 67~77%; Dub the Dew·#MakeItHappy; 국내 자동 사전심의(Drafttype) |
| 셀피/사진 UGC | 중 | 상 | **상** | 하 | 상(15초의 명성) | Walkers Wave 사고; Clear Channel Social Amplification; 코드스토리(사진 잘 나오는 전시=공유) |
| AR 포토(폰 화면 중심) | 중 | 중 | 하 | 하 | 상 | Kelly 2019(허니팟 약화 위험) → 결과를 대형 화면에도 띄울 것 |
| 폰 라이트쇼(플래시 동기) | 하 | 상(군중) | 하 | 하 | 중 | 집단 응원 문화 적합(6절); 학술·실측 근거 미확보 [미확인] |
| 사운드/함성 반응(마이크) | **최하**(폰 불필요) | 상 | 하 | 중 | 상 | Vogel 암묵 단계; 월드컵 거리응원; 소음 민원 주의(3.3) |
| 생성형 AI 공동창작(프롬프트→이미지) | 중 | 상 | **상**(프롬프트 인젝션·혐오 생성) | 상 | 중 | 스위트앤데이터(개인화); #MakeItHappy형 자동 변환 리스크 → 선택지형 프롬프트 |
| 기부/카운트 시각화 | 하 | 중 | 하 | 상(누적) | 상 | 사회적 증거 원칙(13); 실측 사례 미확보 [미확인] |
| 응원·팬덤 메시지(사전 접수→집계 송출) | 하 | 상(팬덤) | 중(사전 검수) | 상(이벤트마다) | 상 | 카카오모빌리티 DAY6(2만 스크린 QR→서울역 파노라마), 생일광고 시장 |

권장 조합(제품 관점): **암묵 반응(사운드/실루엣) → 탭 1회 투표/라이트쇼 → 그룹 미니게임 → 사전검수형 팬덤 메시지**의 사다리 구조. 자유 텍스트·셀피·생성 AI는 "지연 송출+자동 필터+인간 샘플링"이 갖춰진 뒤 2단계로.

---

## 8. 주요 출처

| URL | 제목 | 날짜 | 등급 |
|---|---|---|---|
| https://www.researchgate.net/publication/221054596_Enticing_People_to_Interact_with_Large_Public_Displays_in_Public_Spaces | Brignull & Rogers, Enticing People to Interact with Large Public Displays (INTERACT) | 2003 | A |
| https://dl.acm.org/doi/10.1145/1873951.1874203 (PDF http://www.florian-alt.org/unibw/wp-content/publications/mueller2010mm.pdf) | Müller, Alt, Michelis, Schmidt, Requirements and design space for interactive public displays (MM'10) | 2010-10 | A |
| https://doi.org/10.1080/10447318.2011.555299 | Michelis & Müller, The Audience Funnel (IJHCI 27(6)) | 2011 | A |
| http://www.florian-alt.org/academic/project/looking-glass/ (DOI 10.1145/2207676.2207718) | Müller et al., Looking Glass (CHI'12) | 2012 | A |
| https://www.dgp.toronto.edu/papers/dvogel_UIST2004.pdf | Vogel & Balakrishnan, Interactive Public Ambient Displays (UIST'04) | 2004-10 | A |
| http://www.florian-alt.org/unibw/wp-content/publications/alt2013chi.pdf (DOI 10.1145/2470654.2466226) | Alt et al., Interaction techniques for creating and exchanging content with public displays (CHI'13) | 2013 | A |
| https://www.jorgegoncalves.com/docs/chi13.pdf (DOI 10.1145/2470654.2466225) | Kukka et al., What makes you click (CHI'13) | 2013 | A |
| https://doi.org/10.1007/978-3-540-79576-6_14 | Huang, Koster, Borchers, Overcoming Assumptions… (Pervasive'08) | 2008 | A |
| https://doi.org/10.1007/978-3-642-01516-8_1 | Müller et al., Display Blindness (Pervasive Advertising) | 2009 | A |
| https://doi.org/10.1145/2702123.2702150 | Dalton, Collins, Marshall, Display Blindness? (CHI'15) | 2015 | A |
| https://dl.acm.org/doi/10.1145/3214276 | Parker, Tomitsch, Kay, Does the Public Still Look at Public Displays? (IMWUT) | 2018-06 | A |
| https://dl.acm.org/doi/10.1145/2901790.2901796 | Wouters et al., Uncovering the Honeypot Effect (DIS'16) | 2016 | A |
| https://dl.acm.org/doi/10.1145/3290605.3300515 | Kelly et al., Can Mobile AR Stimulate a Honeypot Effect? (CHI'19) | 2019 | A |
| https://www.frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2025.1714725/full | Kuratomo, Kray, Zempo, Honey-pot effect on pedestrian attention… (Frontiers VR) | 2025-12-04 | A |
| https://doi.org/10.20380/GI2019.21 | Jumping on the Bandwagon: Overcoming Social Barriers to Public Display Use (GI 2019) | 2019 | A |
| https://dl.acm.org/doi/10.1145/2611009.2611016 | Tomitsch et al., Who cares about the Content? (PerDis'14) | 2014 | A |
| https://dl.acm.org/doi/10.1145/2531602.2531639 | Valkanova et al., MyPosition (CSCW'14) | 2014 | A |
| https://dl.acm.org/doi/10.1145/2611009.2611015 | Steinberger, Foth, Alt, Vote With Your Feet (PerDis'14) | 2014 | A |
| https://doi.org/10.1145/2628363.2634222 | Baldauf et al., Interactive opinion polls on public displays (MobileHCI'14) | 2014 | A |
| https://doi.org/10.4018/978-1-4666-8583-3.ch011 | Baldauf & Fröhlich, Investigating Serendipitous Smartphone Interaction with Public Displays | n.d. | A |
| https://ubicomp.oulu.fi/files/displays_chapter.pdf | Hosio, Goncalves, Kostakos, Riekki, Exploring Civic Engagement on Public Displays | c.2014 | A |
| https://doi.org/10.1145/2838739.2838801 | Webber et al., Everybody Dance Now (OzCHI'15) | 2015 | A |
| https://doi.org/10.1145/3132787.3139205 | Pattanakimhun et al., Enhanced engagement with public displays through mobile phone interaction (SA'17) | 2017 | A |
| https://doi.org/10.1145/3025453.3025531 | Sahibzada, Hornecker, Echtler, Fischer, Designing Interactive Advertisements for Public Displays (CHI'17) | 2017 | A |
| https://doi.org/10.1145/3563657.3595985 | Mast et al., Participation Patterns of Interactive Playful Museum Exhibits (DIS'23) | 2023 | A |
| https://www2.census.gov/library/working-papers/2024/adrm/cbsm/rsm2024-05.pdf | US Census Bureau, Usability of QR Code as a Method to Access a Survey (RSM2024-05) | 2024 | A |
| https://outdoorimpact.no/wp-content/uploads/2019/08/AM4DOOH-Whitepaper-2018.pdf | Lumen/AM4DOOH, Attention to DOOH whitepaper | 2018 | A/B |
| https://lumen-research.com/white-papers/study-with-jcdecaux-clear-channel-exterion-and-apg-the-reality-of-attention-to-dooh/ | Lumen, The reality of attention to DOOH | 2017-05-01 | B |
| https://oceanoutdoor.com/the-attention-dividend/ | Ocean Outdoor × Lumen, The Attention Dividend | 2025-06-11 | B |
| https://www.jcdecaux.co.uk/perfect-poster | JCDecaux UK, Perfect Poster | 2025 | B |
| https://www.outfront.com/resources/creative-best-practices | Outfront, Creative Best Practices | n.d. | A |
| https://clearchanneloutdoor.com/creative-solutions/ | Clear Channel Outdoor, Creative Solutions | n.d. | A |
| https://oaaa.org/blog-posts/the-qr-code-comeback-5-tips-for-out-of-home-designers/ | OAAA × Intersection, The QR Code Comeback: 5 Tips | 2021-01-27 | A/B |
| https://oaaa.org/blog-posts/nielsen-research-dooh-engages-consumers-and-drives-activations/ | OAAA, Nielsen Research: DOOH Engages Consumers | 2020-08-03 | B |
| https://oaaa.org/resources/the-harris-poll-ooh-consumer-insights-intent-q1-2022/ | OAAA × Harris Poll, Consumer Insights & Intent (Early 2022) | 2022 | B |
| (URL 미확인, oaaa.org 리소스센터) | OAAA × Harris Poll, OOH Amplification (n=1,661) / DOOH 팩트시트(n=1,023) | 2024-11 / 2024-04 | B |
| https://bitly.com/blog/state-of-qr-code-scans-2026/ | Bitly, The State of QR Code Scans in 2026 | 2026-03-10 | B |
| https://doohmarketing.com/tips/qr-codes | DOOH Marketing(Goldfish Ads), QR Codes in DOOH: The Honest Case Against Using One | 2026 | C/B |
| https://www.uniqode.com/unique-angles/qr-code-benchmark-tool | Uniqode, QR Code Benchmarks by Industry | 2026 | C |
| https://www.enpromolive.com/resource_center/documentation/jumbotron-live-events.php | Promo On Demand, Jumbotron & Live Events (벤더) | n.d. | C |
| https://invidis.com/sixteen-nine/2012/01/05/qr-codes-still-a-mystery-to-most-even-those-who-do-scan/ | Sixteen:Nine(Haynes), QR Codes Still A Mystery | 2012-01-05 | B |
| https://invidis.com/sixteen-nine/2013/01/03/research-insist-qr-codes-product-information/ | Sixteen:Nine, If You Insist On QR Codes… | 2013-01-03 | B |
| https://invidis.com/sixteen-nine/2014/09/26/projects-interactive-ad-pods-in-bangalore/ | Sixteen:Nine, Interactive Ad Pods in Bangalore ("Stupid People Tricks") | 2014-09-26 | B |
| https://invidis.com/sixteen-nine/2016/06/23/how-much-time-do-digital-signage-displays-really-have-with-viewers/ | Sixteen:Nine, How Much Time Do Displays Really Have With Viewers? | 2016-06-23 | B |
| https://invidis.com/sixteen-nine/2017/10/26/no-more-stupid-people-tricks-microsoft-kills-off-kinect/ | Sixteen:Nine, No More Stupid People Tricks | 2017-10-26 | B |
| https://invidis.com/sixteen-nine/2021/04/22/submarine-takes-slow-dive-based-on-viewers-of-those-uk-digital-billboard/ | Sixteen:Nine, Submarine Takes Slow Dive… | 2021-04-22 | B |
| https://ppc.land/second-screen/ | PPC Land, Explaining second screen (Coinbase 2,000만 접속) | n.d. | B/C |
| https://knowyourmeme.com/memes/events/dub-the-dew | Know Your Meme, Dub the Dew | 2012-08 | C/B |
| https://en.wikipedia.org/wiki/Boaty_McBoatface | Wikipedia, Boaty McBoatface | 2016 | B |
| https://en.wikipedia.org/wiki/Personalized_marketing | Wikipedia, Personalized marketing (#MakeItHappy/Gawker) | 2015-02 | B |
| http://www.ytn.co.kr/_ln/0103_201604261930125784 | YTN, 여수 버스정류장에 '음란 동영상'… 해킹 추정 | 2016-04-26 | B |
| http://www.yonhapnewstv.co.kr/AKR20250528090137741 | 연합뉴스TV, 식당 전광판 해킹해 尹이미지 송출… 벌금 500만원 | 2025-05-28 | B |
| https://www.mt.co.kr/tech/2022/03/06/2022030416463755422 | 머니투데이, "흔들어 QR 체크인, 이제 끝…" | 2022-03-06 | B |
| https://www.sedaily.com/NewsView/2677UBUYF1 | 서울경제, [2년간 '방역 첨병' 네카오] QR체크 43억번 | 2022-06-12 | B |
| https://www.etnews.com/20250929000454 | 전자신문, 스마트폰 보급률 97%… | 2025-09-29 | B |
| https://kpenews.com/View.aspx?No=4246190 | 한국은행 2026 상반기 지급카드·간편결제 통계 보도 | 2026 | B |
| https://www.dailian.co.kr/news/view/1545710/ | 데일리안, 카카오모빌리티 DAY6 참여형 캠페인 | 2025-08 | B |
| https://www.ddaily.co.kr/page/view/2026051311194186590 | 디지털데일리, "명동 전광판도 앱으로 예약"… | 2026-05-13 | B |
| https://www.ebn.co.kr/news/articleView.html?idxno=1724437 | EBN, U+일상비일상의틈 고객 참여형 아트 플랫폼 | 2026-09-16 | B |
| https://www.newsis.com/view/NISX20260209_0003508432 | 뉴시스, 대구 동성로 디지털 전광판 규제 완화 '미디어 스트리트' | 2026-02-09 | B |
| https://www.imaeil.com/page/view/2025011417360273751 | 매일신문, 효목고가도로 미디어파사드 민원 | 2025-01-14 | B |
| https://blog.naver.com/aplan-company/224320724295 ; https://blog.naver.com/smitz/224315700671 ; https://blog.naver.com/codestory_biz/224206881823 ; https://www.thegreammedia.com/magazine/12 | 국내 미디어아트 제작사 블로그·매거진 | 2025~2026 | C |

---

## 9. 불확인/추가조사 필요

1. **Audience Funnel 단계별 수치**(660명 중 각 단계 인원·전환율) — IJHCI 원문(Taylor & Francis 403)·researchgate 접근 실패. 기관 구독으로 확인 필요.
2. **Parker 2018 디스플레이별 시선율·상호작용율**, **Dalton 2015 글랜스 지속시간**, **Baldauf 2014 채널별 투표량**, **Kelly 2019 AR 허니팟 결과** — 초록만 확보.
3. **영국 대학도서관 QR 관찰연구**(7,356명 → 0.79% 접근, 0.30% 스캔) — 검색 요약에서만 확인, 저널·URL 미확인.
4. **Walkers Wave(2017-05) 1차 보도 URL** — 세션 내 미확보(Guardian 추정 URL 404).
5. **OAAA×Harris 2024 보고서 2종의 공식 URL**(PDF는 확보).
6. **Reddit·LinkedIn·Medium 실무자 스레드** — 네트워크 차단. 추천 쿼리: r/digitalsignage "touch screen nobody uses", r/TouchDesigner "installation public lessons learned", r/experientialmarketing "QR code billboard stats", r/vjing "crowd interaction". Talon Outdoor 사이트는 522 오류.
7. **"2초 룰"의 공식 출처** — Clear Channel/Lamar 문서에서 문구 미확인(Lamar 크리에이티브 팁 페이지 재시도 권장).
8. **국내 5G 가입자 최신치**, **국내 QR 결제 이용 경험률 설문**, **DAY6 캠페인 접수 건수**, **서울라이트 시민 사진 접수 수** — 미공개/미확보.
9. **아동·청소년 vs 성인 참여율 필드 데이터**, **폰 라이트쇼·기부 카운트 포맷의 실측 참여율** — 학술·업계 모두 미확보.
10. **한국 공공 디스플레이 참여 정량 연구** — RISS/KoreaScience 검색 결과는 구현 논문 위주; KCI 키워드 "미디어파사드 관객 참여 행동 관찰", "디지털 사이니지 인터랙션 참여율"로 재검색 권장.
11. **국내 경품·개인정보 법령 세부**(경품고시, 개인정보 최소수집)는 법률 검토 필요.
