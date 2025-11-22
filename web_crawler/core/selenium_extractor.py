"""
Selenium을 사용한 상품 상세 정보 추출 모듈
리뷰와 성분 정보를 JavaScript 로드되는 상품 상세페이지에서 추출
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import NoSuchElementException, TimeoutException, WebDriverException
from bs4 import BeautifulSoup
import time
import json
from typing import List, Dict, Optional

# 상수 import
from config.constants import USER_AGENT_CHROME, CHROME_OPTIONS_COMMON, SELENIUM_WINDOW_SIZE

class SeleniumProductExtractor:
    """Selenium을 사용한 상품 상세 정보 추출 클래스"""

    def __init__(self, headless: bool = True):
        """
        Args:
            headless: 브라우저를 백그라운드에서 실행할지 여부
        """
        self.headless = headless
        self.driver = None
        self._setup_driver()

    def _setup_driver(self):
        """Chrome WebDriver 설정"""
        try:
            chrome_options = Options()
            if self.headless:
                chrome_options.add_argument('--headless')  # 백그라운드 실행

            # 공통 Chrome 옵션 적용
            for option in CHROME_OPTIONS_COMMON:
                chrome_options.add_argument(option)

            # 창 크기 설정
            chrome_options.add_argument(f'--window-size={SELENIUM_WINDOW_SIZE}')

            # User-Agent 설정
            chrome_options.add_argument(f'--user-agent={USER_AGENT_CHROME}')

            # Selenium의 자동 ChromeDriver 설치
            self.driver = webdriver.Chrome(options=chrome_options)

            print("✅ ChromeDriver 설정 완료")

        except Exception as e:
            print(f"❌ ChromeDriver 설정 실패: {e}")
            print("💡 Chrome 브라우저가 설치되어 있는지 확인해주세요.")
            raise

    def extract_product_details(self, product_url: str, max_reviews: int = 5) -> Dict:
        """
        상품 상세 페이지에서 성분과 리뷰 정보 추출

        Args:
            product_url: 상품 상세 페이지 URL
            max_reviews: 최대 리뷰 추출 개수

        Returns:
            추출된 정보 딕셔너리
        """
        details: Dict[str, Any] = {
            'detail_info': {},
            'reviews': []
        }

        try:
            self.driver.get(product_url)
            time.sleep(2)  # 페이지 로드 대기

            # # 성분 정보 추출
            details['detail_info'] = self._extract_detail_info()

            # 리뷰 정보 추출
            details['reviews'] = self._extract_reviews(max_reviews)

        except Exception as e:
            print(f"❌ 상품 정보 추출 실패 ({product_url}): {e}")
            details['extraction_error'] = str(e)

        return details

    def _extract_detail_info(self) -> Dict[str, Any]:
        """
        상품정보 제공고시 테이블에서 상세 정보를 추출

        Returns:
            상세 정보 딕셔너리 (성분 정보만 추출)
        """
        try:
            # 1. "상품정보 제공고시" 버튼 찾기 및 클릭
            button_selectors = [
                'button.Accordion_accordion-btn__IYjKm',  # CSS 클래스 기반
                '//*[@id="tab-panels"]/section/ul/li[1]/button'  # XPath 기반
            ]

            button_clicked = False
            for selector in button_selectors:
                try:
                    if selector.startswith('//'):
                        info_button = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.XPATH, selector))
                        )
                    else:
                        info_button = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                        )

                    info_button.click()
                    time.sleep(2)  # 동적 콘텐츠 로딩 대기
                    button_clicked = True
                    print("✅ 상품정보 제공고시 버튼 클릭 성공")
                    break

                except Exception as e:
                    print(f"버튼 클릭 시도 실패 ({selector}): {e}")
                    continue

            if not button_clicked:
                print("⚠️  상품정보 제공고시 버튼을 찾을 수 없음")
                return {}

            # 2. 동적으로 로드된 테이블 데이터 추출
            try:
                # 테이블 컨테이너 찾기
                table_container_selectors = [
                    '.Accordion_content__aIya4',
                    '//*[@id="tab-panels"]/section/ul/li[1]/div'
                ]

                table_container = None
                for selector in table_container_selectors:
                    try:
                        if selector.startswith('//'):
                            table_container = WebDriverWait(self.driver, 5).until(
                                EC.presence_of_element_located((By.XPATH, selector))
                            )
                        else:
                            table_container = WebDriverWait(self.driver, 5).until(
                                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                            )
                        break
                    except:
                        continue

                if not table_container:
                    print("⚠️  테이블 컨테이너를 찾을 수 없음")
                    return {}

                # 테이블에서 모든 th/td 쌍 추출 (JavaScript 사용)
                table_data = self.driver.execute_script("""
                    const container = arguments[0];
                    const rows = container.querySelectorAll('tr');
                    const data = {};

                    rows.forEach(row => {
                        const th = row.querySelector('th');
                        const td = row.querySelector('td');

                        if (th && td) {
                            const key = th.textContent.trim();
                            let value = td.textContent.trim();

                            // 줄바꿈 문자를 공백으로 변환
                            value = value.replace(/\\n/g, ' ').replace(/\\s+/g, ' ');

                            data[key] = value;
                        }
                    });

                    return data;
                """, table_container)

                print(f"✅ 상세 정보 테이블 추출 완료: {len(table_data)}개 항목")

                # 3. 화장품법에 따른 모든 성분 정보 추출 (사용자가 요청한 핵심 정보)
                ingredients_key = '화장품법에 따라 기재해야 하는 모든 성분'
                if ingredients_key in table_data:
                    ingredients_text = table_data[ingredients_key]
                    # ,로 구분된 성분들을 분리하고 정리
                    ingredients_list = [ing.strip() for ing in ingredients_text.split(',') if ing.strip()]
                    print(f"✅ 성분 정보 추출: {len(ingredients_list)}개 성분")

                    return {
                        'full_info': table_data,  # 전체 상세 정보
                        'ingredients': ingredients_list  # 주요 성분 정보만 별도 추출
                    }
                else:
                    print("⚠️  성분 정보 키를 찾을 수 없음")
                    return {'full_info': table_data, 'ingredients': []}

            except Exception as e:
                print(f"테이블 데이터 추출 실패: {e}")
                return {}

        except Exception as e:
            print(f"❌ 상세 정보 추출 실패: {e}")
            return {}

    def _extract_reviews(self, max_reviews: int = 10) -> List[str]:
        # 1️⃣ 리뷰 탭 클릭
        review_selectors_priority = [
            'button[class*="GoodsDetailTabs_tab-item"]:nth-child(2)',
            '//*[@id="main"]/div[2]/div/div[3]/div[2]/div[1]/div/div/button[1]',
        ]
        clicked = False
        for selector in review_selectors_priority:
            try:
                if selector.startswith('//'):
                    review_tab = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, selector))
                    )
                else:
                    review_tab = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                    )
                review_tab.click()
                time.sleep(2)
                clicked = True
                break
            except:
                continue
        if not clicked:
            return []

        # 2️⃣ 리뷰 컨테이너
        try:
            container = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'oy-review-review-in-product'))
            )
        except:
            return []


        # 3️⃣ 전체 윈도우 스크롤로 리뷰 로드
        prev_height = self.driver.execute_script("return document.body.scrollHeight")
        for _ in range(20):  # 최대 10번 반복
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1)  # 로딩 대기
            new_height = self.driver.execute_script("return document.body.scrollHeight")
            if new_height == prev_height:
                break  # 더 이상 새 리뷰 없음
            prev_height = new_height

        # 4️⃣ Shadow DOM 포함 모든 리뷰 수집 + p 태그 추출
        script = """
        const MAX_DEPTH = 300;

        // BFS로 oy-review-review-item 수집
        function bfsCollectItems(root) {
            const queue = [{node: root, depth:0}];
            const items = [];
            while (queue.length) {
                const {node, depth} = queue.shift();
                if (!node || depth > MAX_DEPTH) continue;

                if (node.tagName && node.tagName.toLowerCase() === 'oy-review-review-item') {
                    items.push(node);
                    continue;
                }
                if (node.shadowRoot) queue.push({node: node.shadowRoot, depth: depth+1});
                if (node.children) {
                    for (const child of node.children) {
                        queue.push({node: child, depth: depth+1});
                    }
                }
            }
            return items;
        }

        // DFS로 p 태그 1개 찾기
        function dfsFindP(node, depth) {
            if (!node || depth > MAX_DEPTH) return null;
            if (node.tagName && node.tagName.toLowerCase() === 'p') return node;
            if (node.shadowRoot) {
                const found = dfsFindP(node.shadowRoot, depth+1);
                if (found) return found;
            }
            if (node.children) {
                for (const child of node.children) {
                    const found = dfsFindP(child, depth+1);
                    if (found) return found;
                }
            }
            return null;
        }

        const root = arguments[0];
        const max_reviews = arguments[1];
        const items = bfsCollectItems(root);
        const resultTexts = [];
        for (const item of items) {
            const p = dfsFindP(item, 0);
            if (p) resultTexts.push(p.innerText.trim());
            if (resultTexts.length >= max_reviews) break;
        }
        return resultTexts;
        """

        reviews = self.driver.execute_script(script, container, max_reviews)

        print(f"리뷰 데이터: {reviews}")
        return reviews

    def batch_extract_details(self, products: List[Dict], max_reviews: int = 5) -> List[Dict]:
        """
        여러 상품에 대해 상세 정보 batch 추출

        Args:
            products: 상품 기본 정보 리스트
            max_reviews: 상품당 최대 리뷰 수

        Returns:
            상세 정보가 추가된 상품 리스트
        """
        enriched_products = []
        total_products = len(products)

        for i, product in enumerate(products, 1):
            print(f"📦 상품 {i}/{total_products} 상세 정보 추출 중...")

            try:
                # 상품 상세 정보 추출
                details = self.extract_product_details(product['url'], max_reviews)

                # 기존 상품 정보에 상세 정보 합치기
                enriched_product = product.copy()
                enriched_product.update(details)
                enriched_products.append(enriched_product)

                print(f"   ✅ 상세 정보: {len(details.get('detail_info', []))}개, 리뷰: {len(details.get('reviews', []))}개")
                print(f"   ✅ 상세 정보 키: {list(details.keys())}")

            except Exception as e:
                print(f"   ❌ 상품 처리 실패: {e}")
                # 실패하더라도 기본 정보만 넣기
                enriched_products.append(product)

            time.sleep(1)  # 상품 간 딜레이

        return enriched_products

    def close(self):
        """브라우저 종료"""
        if self.driver:
            self.driver.quit()
            print("🔚 브라우저 종료 완료")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

if __name__ == "__main__":
    # 테스트 실행
    with SeleniumProductExtractor(headless=True) as extractor:
        # 샘플 URL로 테스트 (실제로 존재하는 올리브영 상품 URL 사용)
        test_url = "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000222698"

        print("테스트 상품 정보 추출 중...")
        details = extractor.extract_product_details(test_url, max_reviews=10)

        print(f"성분 수: {len(details.get('ingredients', []))}")
        print(f"리뷰 수: {len(details.get('reviews', []))}")
        print(f"전체 상세 정보: {list(details.keys())}")
        
        # 상세 정보 출력
        for key, value in details.items():
            if key not in ['ingredients', 'reviews']:
                print(f"  {key}: {value}")

        # if details['reviews']:
        #     print(f"첫 번째 리뷰 별점: {details['reviews'][0].get('star', 'N/A')}")
