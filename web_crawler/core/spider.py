"""
웹 페이지 탐색 및 데이터 추출 모듈
"""

import csv
import sqlite3
import os
import json
import requests
from pathlib import Path
from bs4 import BeautifulSoup

from .request_handler import RequestHandler
# 상수 import
from config.constants import OLIVEYOUNG_BASE_URL, OLIVEYOUNG_SKINCARE_URL, OLIVEYOUNG_PARAMS_DEFAULT, IMAGES_DIR

class WebSpider:
    """웹 크롤링을 위한 스파이더 클래스"""

    def __init__(self, base_url=None):
        self.base_url = base_url or OLIVEYOUNG_BASE_URL
        self.request_handler = RequestHandler()

        # 이미지 저장 디렉토리 생성
        self.images_dir = Path(IMAGES_DIR)
        self.images_dir.mkdir(parents=True, exist_ok=True)

        # 올리브영 스킨케어 랭킹 페이지 URL
        self.target_url = OLIVEYOUNG_SKINCARE_URL
        self.params = OLIVEYOUNG_PARAMS_DEFAULT.copy()

    def fetch_page(self, page=1):
        """지정된 페이지의 상품 데이터를 가져옵니다"""
        try:
            self.params['pageIdx'] = str(page)
            response = self.request_handler.get(self.target_url, params=self.params)

            if response:
                # BeautifulSoup으로 파싱
                soup = BeautifulSoup(response.content, 'html.parser')
                return soup
            else:
                print(f"페이지 {page} 요청 실패")
                return None
        except Exception as e:
            print(f"페이지 {page} 요청 실패: {e}")
            return None

    def extract_products(self, soup):
        """HTML에서 상품 정보를 추출합니다"""
        products = []

        try:
            # 상품 목록 컨테이너 찾기 (올리브영 구조에 맞게 조정)
            product_items = soup.find_all('div', class_='prd_info')

            for rank, item in enumerate(product_items, 1):  # rank 1부터 시작
                try:
                    # 상품명 추출
                    product_name_elem = item.find('p', class_='tx_name')
                    product_name = product_name_elem.get_text(strip=True) if product_name_elem else "Unknown"

                    # 가격 추출
                    price_elem = item.find('span', class_='tx_cur')
                    price = price_elem.get_text(strip=True).replace(',', '').replace('원', '') if price_elem else "0"

                    # 브랜드 추출
                    brand_elem = item.find('span', class_='tx_brand')
                    brand = brand_elem.get_text(strip=True) if brand_elem else "Unknown"

                    # 평점 추출
                    rating_elem = item.find('span', class_='rating')
                    rating = rating_elem.get_text(strip=True) if rating_elem else "0.0"

                    # 상품 URL 추출 (goodsNo 파라미터 찾기)
                    goods_no = self._extract_goods_no(item)
                    if goods_no:
                        url = f"{self.base_url}/store/goods/getGoodsDetail.do?goodsNo={goods_no}"
                    else:
                        url = f"{self.base_url}/store/goods/getGoodsDetail.do?goodsNo=UNKNOWN"

                    # 상품 이미지 추출
                    image_url = self._extract_image_url(item)
                    image_path = None
                    if image_url and goods_no:
                        image_path = self._download_image(image_url, goods_no)

                    product = {
                        'rank': rank,  # 랭킹 정보 추가
                        'name': product_name,
                        'brand': brand,
                        'price': int(price) if price.isdigit() else 0,
                        'rating': float(rating) if rating.replace('.', '').isdigit() else 0.0,
                        'category': '스킨케어',
                        'url': url,  # 실제 goodsNo를 포함한 URL
                        'image_url': image_url,  # 원본 이미지 URL
                        'image_path': image_path  # 로컬에 저장된 이미지 경로
                    }

                    products.append(product)

                except Exception as e:
                    print(f"상품 정보 추출 실패: {e}")
                    continue

        except Exception as e:
            print(f"상품 목록 추출 실패: {e}")

        return products

    def _extract_goods_no(self, item_elem):
        """상품 요소에서 goodsNo를 추출합니다"""
        try:
            # 상품 상세 링크 찾기 (상품명 링크)
            link_elem = item_elem.find('a')
            if link_elem and 'href' in link_elem.attrs:
                href = link_elem['href']
                # href에서 goodsNo 파라미터 추출
                if 'goodsNo=' in href:
                    # URL에서 goodsNo 값 추출
                    goods_no_start = href.find('goodsNo=') + len('goodsNo=')
                    goods_no_end = href.find('&', goods_no_start)
                    if goods_no_end == -1:
                        goods_no_end = len(href)
                    goods_no = href[goods_no_start:goods_no_end]
                    return goods_no
                elif href.startswith('/store/goods/getGoodsDetail.do'):
                    # 상대 경로에서도 파싱
                    goods_no_start = href.find('goodsNo=') + len('goodsNo=')
                    if goods_no_start > len('goodsNo='):
                        goods_no_end = href.find('&', goods_no_start)
                        if goods_no_end == -1:
                            goods_no_end = len(href)
                        goods_no = href[goods_no_start:goods_no_end]
                        return goods_no
        except Exception as e:
            print(f"goodsNo 추출 실패: {e}")

        return None  # goodsNo를 찾지 못한 경우

    def _extract_image_url(self, item_elem):
        """상품 요소에서 이미지 URL을 추출합니다"""
        try:
            # 상품 이미지 찾기
            img_elem = item_elem.find('img')
            if img_elem and 'src' in img_elem.attrs:
                src = img_elem['src']
                # 호스트가 없는 상대경로인 경우 절대경로로 변환
                if not src.startswith('http'):
                    # 이미 AUHOST가 설정되어 있다면 사용, 아니면 기본으로
                    if 'image.oliveyoung.co.kr' in src:
                        src = f"https:{src}" if src.startswith('//') else f"https://image.oliveyoung.co.kr{src}"
                    else:
                        # 기본 케이스
                        src = f"https://image.oliveyoung.co.kr{src}"
                return src
        except Exception as e:
            print(f"이미지 URL 추출 실패: {e}")

        return None  # 이미지 URL을 찾지 못한 경우

    def _download_image(self, image_url, goods_no):
        """상품 이미지를 다운로드하여 로컬에 저장합니다"""
        try:
            # 파일명 생성 (goods_no로 고유하게)
            filename = f"{goods_no}.jpg"
            filepath = self.images_dir / filename

            # 이미 존재한다면 건너뛰기
            if filepath.exists():
                print(f"이미지 이미 존재: {filepath}")
                try:
                    return str(filepath.relative_to(Path.cwd()))
                except ValueError:
                    return str(filepath)

            # 다운로드
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()

            # 파일 저장
            with open(filepath, 'wb') as f:
                f.write(response.content)

            print(f"이미지 다운로드 완료: {filepath}")
            try:
                return str(filepath.relative_to(Path.cwd()))
            except ValueError:
                # 상대 경로 계산 실패시 절대 경로 사용
                return str(filepath)

        except Exception as e:
            print(f"이미지 다운로드 실패 ({image_url}): {e}")
            return None

    def crawl_products(self, max_pages=5):
        """여러 페이지에 걸쳐 상품을 크롤링합니다"""
        all_products = []

        for page in range(1, max_pages + 1):
            print(f"페이지 {page} 크롤링 중...")

            soup = self.fetch_page(page)
            if soup is None:
                break

            products = self.extract_products(soup)
            print(f"페이지 {page}: {len(products)}개 상품 발견")

            if not products:
                break

            all_products.extend(products)

            # request_handler의 rate limiting으로 대체됨


        return all_products

    def save_to_csv(self, products, filename="products.csv"):
        """상품 데이터를 CSV 파일로 저장합니다"""
        output_dir = Path("output")
        output_dir.mkdir(exist_ok=True)
        filepath = output_dir / filename

        if not products:
            print("저장할 상품 데이터가 없습니다.")
            return

        try:
            # 동적으로 필드명 결정 (모든 상품의 키를 수집)
            fieldnames = set()
            for product in products:
                fieldnames.update(product.keys())

            # 기본 필드 순서 보장
            ordered_fields = ['rank', 'name', 'brand', 'price', 'rating', 'category', 'url', 'ingredients', 'reviews']
            additional_fields = sorted(fieldnames - set(ordered_fields))
            final_fieldnames = ordered_fields + additional_fields

            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=final_fieldnames)

                writer.writeheader()
                for product in products:
                    writer.writerow(product)

            print(f"CSV 파일로 {len(products)}개 상품 저장 완료: {filepath}")

        except Exception as e:
            print(f"CSV 저장 실패: {e}")

    def save_to_sqlite(self, products, db_path="products.db"):
        """상품 데이터를 SQLite 데이터베이스로 저장합니다"""
        output_dir = Path("output")
        output_dir.mkdir(exist_ok=True)
        db_filepath = output_dir / db_path

        try:
            conn = sqlite3.connect(db_filepath)
            cursor = conn.cursor()

            # 기존 테이블 삭제 후 새로 생성 (스키마 변경을 위해)
            cursor.execute('DROP TABLE IF EXISTS products')

            # 테이블 생성
            cursor.execute('''
                CREATE TABLE products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rank INTEGER,
                    name TEXT NOT NULL,
                    brand TEXT,
                    price INTEGER,
                    rating REAL,
                    category TEXT,
                    url TEXT,
                    image_url TEXT,          -- Original image URL
                    image_path TEXT,         -- Local image path
                    ingredients TEXT,        -- JSON array of ingredients
                    additional_info TEXT,    -- JSON object of detailed info (full_info)
                    reviews TEXT,            -- JSON array of reviews
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 데이터 삽입
            for product in products:
                # 상세 정보에서 데이터를 추출
                detail_info = product.get('detail_info', {})
                ingredients = detail_info.get('ingredients', []) if isinstance(detail_info, dict) else []
                additional_info = detail_info.get('full_info', {}) if isinstance(detail_info, dict) else {}
                reviews = product.get('reviews', [])

                # JSON 형태로 저장
                ingredients_json = json.dumps(ingredients)
                additional_info_json = json.dumps(additional_info)
                reviews_json = json.dumps(reviews)

                cursor.execute('''
                    INSERT INTO products (rank, name, brand, price, rating, category, url,
                                         image_url, image_path, ingredients, additional_info, reviews)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    product['rank'],
                    product['name'],
                    product['brand'],
                    product['price'],
                    product['rating'],
                    product['category'],
                    product['url'],
                    product.get('image_url'),
                    product.get('image_path'),
                    ingredients_json,
                    additional_info_json,
                    reviews_json
                ))

            conn.commit()
            conn.close()

            print(f"SQLite 데이터베이스로 {len(products)}개 상품 저장 완료: {db_filepath}")

        except Exception as e:
            print(f"SQLite 저장 실패: {e}")

    def crawl_and_save(self, max_pages=2):
        """크롤링 후 CSV와 SQLite에 모두 저장합니다"""
        print("스킨케어 상품 크롤링 시작...")
        products = self.crawl_products(max_pages)

        print(f"총 {len(products)}개 상품 크롤링 완료")

        if products:
            # CSV 저장
            self.save_to_csv(products)

            # SQLite 저장
            self.save_to_sqlite(products)

            print("크롤링 및 저장 작업 완료!")
        else:
            print("크롤링된 상품이 없습니다.")

        return products

if __name__ == "__main__":
    # 테스트 실행
    spider = WebSpider()
    spider.crawl_and_save(max_pages=1)  # 1페이지만 테스트
