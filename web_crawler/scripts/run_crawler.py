#!/usr/bin/env python3
"""
웹 크롤러 메인 실행 스크립트
올리브영 스킨케어 데이터를 크롤링하고 CSV 및 SQLite에 저장
"""

import sys
import os
import json
import argparse

# 프로젝트 루트를 Python 경로에 추가
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

from core.spider import WebSpider
from core.selenium_extractor import SeleniumProductExtractor

def main():
    """메인 실행 함수"""
    parser = argparse.ArgumentParser(description='올리브영 스킨케어 상품 크롤러')
    parser.add_argument('--max-pages', type=int, default=1,
                       help='크롤링할 최대 페이지 수 (기본값: 1)')
    parser.add_argument('--output-dir', type=str, default='output',
                       help='출력 디렉토리 (기본값: output)')
    parser.add_argument('--no-detailed', action='store_true',
                       help='상세 정보 추출 비활성화 (기본적으로 켜져있음)')
    parser.add_argument('--max-reviews', type=int, default=10,
                       help='상품당 최대 리뷰 수 (기본값: 10)')

    args = parser.parse_args()

    # 상세 정보 추출이 기본적으로 켜져있으며, --no-detailed 플래그로 끄기 가능
    args.detailed = not args.no_detailed

    print("🐛 올리브영 스킨케어 상품 크롤러 시작")
    print(f"📄 크롤링할 페이지 수: {args.max_pages}")
    print(f"📂 출력 디렉토리: web_crawler/{args.output_dir}")
    print(f"🔍 상세 정보 추출: {'켜짐' if args.detailed else '꺼짐'}")
    print("-" * 50)

    try:
        # WebSpider 인스턴스 생성
        spider = WebSpider()

        # 크롤링 실행
        products = spider.crawl_products(max_pages=args.max_pages)

        # 상세 정보 추출 (선택적)
        if args.detailed and products:
            print(f"\n🔍 상세 정보 (성분, 리뷰) 추출 중... (Selenium)")
            print(f"   - 상품당 최대 리뷰 수: {args.max_reviews}")


            try:
                with SeleniumProductExtractor(headless=True) as extractor:
                    # 모든 상품에 대해 상세 정보 추출
                    enriched_products = extractor.batch_extract_details(
                        products,
                        max_reviews=args.max_reviews
                    )
                    # 상세 정보가 추가된 상품으로 교체
                    products = enriched_products
                print("✅ 상세 정보 추출 완료!")
            except Exception as e:
                print(f"❌ 상세 정보 추출 실패: {e}")
                print("📝 기본 정보만으로 진행합니다.")

        # 결과 저장
        spider.save_to_csv(products)
        spider.save_to_sqlite(products)

        print(f"\n✅ 크롤링 완료! 총 {len(products)}개 상품 수집")

        if products:
            print("\n📊 저장된 파일:")
            print(f"   - CSV: web_crawler/{args.output_dir}/products.csv")
            print(f"   - SQLite: web_crawler/{args.output_dir}/products.db")

            if args.detailed:
                print("   ✅ 성분 정보 포함됨")
                print(f"   ✅ 상품당 최대 {args.max_reviews}개 리뷰 포함됨")

        print("\n🎉 크롤러 실행 완료!")

    except KeyboardInterrupt:
        print("\n⏹️  사용자가 크롤링을 중단했습니다.")
    except Exception as e:
        print(f"\n❌ 크롤링 중 오류 발생: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
