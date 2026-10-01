# 전략 노트북 — 차세대 사업 탐색 (미디어아트 → 다음 세대)

> 작성 시작: 2026-10-01 · 작성자: 협 + Claude · 상태: **초안(리서치 1차 반영)**
> 이 폴더는 세션이 초기화돼도 남는 "메모장"이다. 새 세션에서는 이 README부터 읽는다.

## 0. 이 노트북의 목적
1. 프로젝션맵핑·미디어파사드(빔프로젝터 기반) 시장 축소에 대응해 **다음 세대 사업**을 찾는다. 미디어아트가 아니어도 된다.
2. 우리 역량 10개를 활용해 진입할 **신산업 후보**를 평가한다.
3. 1순위 가설 **"QR 참여형 스크린 콘텐츠"** (기존 LED 사이니지·파사드 구좌에 QR을 넣고 관객이 스마트폰으로 참여)를 워크플로우·콘텐츠 방향·시장·수익모델(캐시카우) 관점에서 깊게 판다.

## 1. 폴더 지도
| 경로 | 내용 | 주요 ID |
|---|---|---|
| `00-capabilities/capabilities-inventory.md` | 우리 역량 10개, 7가지 분류법, 조합 역량 | CAP-01~10, CMB-xx |
| `01-market-context/problem-statement.md` | 왜 피벗하는가: 프로젝션맵핑·파사드 시장 축소 증거 | — |
| `01-market-context/dooh-market-global.md` | 글로벌 DOOH 시장·인터랙티브 효과 데이터·QR 통계 | — |
| `01-market-context/dooh-market-korea.md` | 국내 옥외광고 시장·자유표시구역·구좌 인벤토리·팬덤 광고 | — |
| `02-new-industry-candidates/candidates-scoring.md` | 신산업 후보 23개 사이징·스코어·다중 분류 | IND-xx |
| `02-new-industry-candidates/peer-pivots.md` | 동종업계(국내·일본·글로벌) 피벗 사례와 성패 패턴 | PEER-xx |
| `03-qr-interactive/00-overview.md` | QR 참여형 스크린 콘텐츠: 한 장 요약·가설·포지셔닝 | — |
| `03-qr-interactive/01-cases.md` | 글로벌·국내 사례 DB | CASE-xx |
| `03-qr-interactive/02-market-and-buyers.md` | 누가 왜 돈을 내는가(광고주·매체사·공공·팬덤) | — |
| `03-qr-interactive/03-content-formats.md` | 콘텐츠 포맷 카탈로그·평가표 | FMT-xx |
| `03-qr-interactive/04-workflow-architecture.md` | 기술 워크플로우·아키텍처·비용 | ARCH-xx |
| `03-qr-interactive/05-business-model.md` | 수익모델 후보·캐시카우 설계·단가 가설 | BM-xx |
| `03-qr-interactive/06-risks-legal.md` | 법규·리스크·모더레이션 | RISK-xx |
| `03-qr-interactive/07-competitors-vendors.md` | 경쟁사·벤더·파트너 후보 | VEN-xx |
| `03-qr-interactive/08-roadmap-mvp.md` | MVP·검증 실험·로드맵 | — |
| `04-design-principles/participation-design.md` | 대중 참여 설계 원칙(HCI 연구+실무) 체크리스트 | DP-xx |
| `90-questions/open-questions.md` | 협에게 묻는 질문 목록(답하면 전략이 바뀌는 것 위주) | Q-xx |
| `91-decisions/decision-log.md` | 결정 기록 | DEC-xx |
| `99-sources/sources.md` | 출처 목록(등급 A/B/C) | SRC-xx |
| `glossary.md` | 용어집 | — |
| `CHANGELOG.md` | 변경 이력 | — |

## 2. ID·태그 체계 (인덱싱 규칙)
- `CAP-nn` 역량 · `CMB-nn` 역량 조합 · `IND-nn` 후보 산업 · `PEER-nn` 동종업계 사례
- `CASE-nn` 참여형 스크린 사례 · `FMT-nn` 콘텐츠 포맷 · `BM-nn` 수익모델 · `ARCH-nn` 아키텍처 옵션
- `RISK-nn` 리스크 · `VEN-nn` 벤더/경쟁사 · `DP-nn` 설계 원칙 · `Q-nn` 질문 · `DEC-nn` 결정 · `SRC-nn` 출처
- 문서 간 참조는 ID로 한다. 새 항목은 해당 문서 끝 번호 다음을 쓴다. 번호는 재사용·재정렬하지 않는다.
- 출처 등급: **A** 공식·1차(정부·공시·산업협회·논문) / **B** 주요 언론·전문지 / **C** 블로그·커뮤니티·업체 홍보. 수치 뒤에 `[A]`처럼 표기. 미검증은 `[미확인]`.
- 상태 태그: `초안` → `검토` → `확정`. 가설은 `H:` 접두어, 사실은 접두어 없음.

## 3. 읽는 순서 (새 세션 권장)
1. `00-capabilities` → 2. `01-market-context/problem-statement.md` → 3. `02-new-industry-candidates/candidates-scoring.md` → 4. `03-qr-interactive/00-overview.md` → 5. `05-business-model.md` → 6. `90-questions`

## 4. 핵심 질문(상시)
- 어떤 역량 조합이 **반복 매출**(구독·운영·라이선스·렌탈)로 바뀌는가?
- QR 참여형 콘텐츠는 **누가, 무엇에, 얼마를** 내는가? 1회성 캠페인이 아니라 **여러 구좌에 반복 판매**되려면 무엇이 제품이어야 하는가?
- 우리가 **매체사의 파트너**가 될 것인가, **광고주의 벤더**가 될 것인가, **플랫폼**이 될 것인가?

## 5. 유지 규칙
- 리서치 결과는 반드시 출처+등급과 함께 기록. 추정치는 `H:`/`[미확인]`.
- 결정은 `91-decisions`에 날짜와 근거를 남긴다. 질문에 답이 나오면 `90-questions`에서 답을 기록하고 관련 문서를 갱신한다.
- 문서가 커지면 분할하되 ID는 유지한다.
