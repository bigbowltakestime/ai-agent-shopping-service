#!/bin/bash

# Web Crawler 시작 스크립트
echo "🐛 올리브영 스킨케어 상품 크롤러 시작"
echo "======================================="

# 프로젝트 루트로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 가상환경 활성화 (있으면)
if [ -d "venv" ]; then
    echo "📦 가상환경 활성화"
    source venv/bin/activate
fi

# Python 경로 설정 및 크롤러 실행
echo "🚀 크롤러 실행 중..."
echo "🔧 PYTHONPATH: $SCRIPT_DIR:$SCRIPT_DIR/.."
PYTHONPATH="$SCRIPT_DIR:$SCRIPT_DIR/.." python scripts/run_crawler.py "$@"

# 종료 메시지
echo "✅ 크롤링 완료!"
echo ""
echo "📊 출력 파일 위치: $SCRIPT_DIR/output/"

# 가상환경 비활성화 (있으면)
if [ -d "venv" ] && [ "$VIRTUAL_ENV" != "" ]; then
    deactivate
fi
