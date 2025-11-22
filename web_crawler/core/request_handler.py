"""
HTTP 요청 처리 모듈
세션 관리, 재시도 로직, 요청 제한 등을 담당
"""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import time
from typing import Optional, Dict, Any

# 상수 import
from config.constants import HTTP_HEADERS

class RequestHandler:
    """HTTP 요청을 처리하는 클래스"""

    def __init__(self, rate_limit: float = 1.0, max_retries: int = 3):
        """
        Args:
            rate_limit: 요청 간 최소 간격 (초)
            max_retries: 최대 재시도 횟수
        """
        self.rate_limit = rate_limit
        self.max_retries = max_retries
        self.last_request_time = 0

        # 세션 생성 및 재시도 전략 설정
        self.session = requests.Session()

        # 재시도 전략
        retry_strategy = Retry(
            total=max_retries,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS"],
            backoff_factor=1
        )

        # HTTPAdapter에 재시도 전략 적용
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

        # 실제 브라우저처럼 헤더 설정 (올리브영 크롤링용)
        self.session.headers.update(HTTP_HEADERS)

    def _wait_for_rate_limit(self):
        """요청 간격을 유지하기 위해 대기"""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time

        if time_since_last_request < self.rate_limit:
            wait_time = self.rate_limit - time_since_last_request
            time.sleep(wait_time)

        self.last_request_time = time.time()

    def get(self, url: str, params: Optional[Dict[str, Any]] = None,
            timeout: int = 30) -> Optional[requests.Response]:
        """
        GET 요청을 수행합니다.

        Args:
            url: 요청할 URL
            params: 쿼리 파라미터
            timeout: 타임아웃 시간 (초)

        Returns:
            성공 시 Response 객체, 실패 시 None
        """
        try:
            self._wait_for_rate_limit()

            response = self.session.get(
                url,
                params=params,
                timeout=timeout,
                allow_redirects=True
            )

            response.raise_for_status()
            return response

        except requests.RequestException as e:
            print(f"GET 요청 실패: {e}")
            return None

    def post(self, url: str, data: Optional[Dict[str, Any]] = None,
             json_data: Optional[Dict[str, Any]] = None,
             timeout: int = 30) -> Optional[requests.Response]:
        """
        POST 요청을 수행합니다.

        Args:
            url: 요청할 URL
            data: 폼 데이터
            json_data: JSON 데이터
            timeout: 타임아웃 시간 (초)

        Returns:
            성공 시 Response 객체, 실패 시 None
        """
        try:
            self._wait_for_rate_limit()

            response = self.session.post(
                url,
                data=data,
                json=json_data,
                timeout=timeout,
                allow_redirects=True
            )

            response.raise_for_status()
            return response

        except requests.RequestException as e:
            print(f"POST 요청 실패: {e}")
            return None

    def close(self):
        """세션을 종료합니다."""
        self.session.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
