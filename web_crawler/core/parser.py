"""
HTML 데이터 파싱 모듈
BeautifulSoup을 사용하여 올리브영 상품 정보를 추출하는 핵심 로직
"""

from bs4 import BeautifulSoup
from typing import List, Dict, Optional

class DataParser:
    """HTML 데이터 파싱을 담당하는 클래스"""

    def parse_product_data_from_soup(self, soup: BeautifulSoup) -> List[Dict]:
        """
        BeautifulSoup 객체에서 상품 데이터를 추출합니다.
        """
        products = []
        product_items = soup.find_all('div', class_='prd_info')

        for item in product_items:
            try:
                product = self._extract_product_info(item)
                if product:
                    products.append(product)
            except Exception as e:
                print(f"상품 파싱 실패: {e}")
                continue

        return products

    def _extract_product_info(self, item) -> Optional[Dict]:
        """단일 상품 정보 추출"""
        try:
            # 상품명 추출
            name_elem = item.find('p', class_='tx_name')
            name = name_elem.get_text(strip=True) if name_elem else "Unknown"

            # 브랜드명 추출
            brand_elem = item.find('span', class_='tx_brand')
            brand = brand_elem.get_text(strip=True) if brand_elem else "Unknown"

            # 가격 추출 및 파싱
            price_elem = item.find('span', class_='tx_cur')
            price_text = price_elem.get_text(strip=True) if price_elem else "0"
            price = self._parse_price(price_text)

            # 평점 추출 및 파싱
            rating_elem = item.find('span', class_='rating')
            rating_text = rating_elem.get_text(strip=True) if rating_elem else "0.0"
            rating = self._parse_rating(rating_text)

            # 상품 URL 추출
            url_elem = item.find('a')
            url = url_elem.get('href') if url_elem else ""

            return {
                'name': name,
                'brand': brand,
                'price': price,
                'rating': rating,
                'category': '스킨케어',
                'url': url
            }

        except Exception as e:
            print(f"상품 정보 추출 실패: {e}")
            return None

    def _parse_price(self, price_text: str) -> int:
        """가격 텍스트에서 숫자를 추출합니다"""
        try:
            price_str = ''.join(filter(str.isdigit, price_text))
            return int(price_str) if price_str else 0
        except:
            return 0

    def _parse_rating(self, rating_text: str) -> float:
        """평점 텍스트에서 숫자를 추출합니다"""
        try:
            rating_str = ''.join(c for c in rating_text if c.isdigit() or c == '.')
            return float(rating_str) if rating_str else 0.0
        except:
            return 0.0

    def validate_product_data(self, products: List[Dict]) -> List[Dict]:
        """상품 데이터 유효성 검증"""
        return [p for p in products if p.get('name', '') != 'Unknown' and p.get('price', 0) > 0]

if __name__ == "__main__":
    # 테스트용 HTML
    test_html = """
    <div class="prd_info">
        <p class="tx_name">올리브영 로션</p>
        <span class="tx_brand">올리브영</span>
        <span class="tx_cur">29,900원</span>
        <span class="rating">4.5</span>
    </div>
    """

    parser = DataParser()
    soup = BeautifulSoup(test_html, 'html.parser')
    products = parser.parse_product_data_from_soup(soup)
    print(f"파싱된 상품 수: {len(products)}")
    if products:
        print("첫 번째 상품:", products[0])
