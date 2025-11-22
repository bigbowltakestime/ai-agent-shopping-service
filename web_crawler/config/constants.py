"""
상수 설정 파일
User-Agent, HTTP 헤더, 기타 설정 값들을 중앙화하여 관리
"""

# User-Agent 설정
USER_AGENT_CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'

# HTTP 헤더 설정 (requests 세션용)
HTTP_HEADERS = {
    'User-Agent': USER_AGENT_CHROME,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Referer': 'https://www.oliveyoung.co.kr/',
}

# 크롤링 관련 상수
REQUEST_TIMEOUT = 30
RATE_LIMIT_DEFAULT = 1.0
MAX_RETRIES_DEFAULT = 3

# Selenium 관련 상수
SELENIUM_WINDOW_SIZE = '1920,1080'
SELENIUM_MAX_JS_DEPTH = 300
SELENIUM_MAX_SCROLL_ATTEMPTS = 20

# 상품 추출 관련 상수
MAX_REVIEWS_DEFAULT = 5
OLIVEYOUNG_BASE_URL = 'https://www.oliveyoung.co.kr'
OLIVEYOUNG_SKINCARE_URL = f'{OLIVEYOUNG_BASE_URL}/store/main/getBestList.do'

# 올리브영 스킨케어 랭킹 API 파라미터 기본값
OLIVEYOUNG_PARAMS_DEFAULT = {
    'dispCatNo': '900000100100001',
    'fltDispCatNo': '10000010001',
    'pageIdx': '1',
    'rowsPerPage': '8',
    't_page': '랭킹',
    't_click': '판매랭킹_스킨케어'
}

# 출력 디렉토리 설정
OUTPUT_DIR = 'output'
IMAGES_DIR = 'output/images'
CSV_FILENAME = 'products.csv'
DB_FILENAME = 'products.db'

# Chrome 오プション 설정
CHROME_OPTIONS_COMMON = [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1920,1080',
]
