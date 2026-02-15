#!/bin/bash

# Chrome 扩展自动打包脚本

set -e  # 遇到错误立即退出

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}开始打包 Chrome 扩展...${NC}"

# 读取版本号
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')
PACKAGE_NAME="chat-line-v${VERSION}.zip"

echo -e "${BLUE}当前版本: ${VERSION}${NC}"

# 检查必需文件
REQUIRED_FILES=("manifest.json" "content.js" "styles.css" "icon16.png" "icon48.png" "icon128.png")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}错误: 缺少必需文件 $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ 所有必需文件检查通过${NC}"

# 创建临时目录
TEMP_DIR=$(mktemp -d)
echo -e "${BLUE}创建临时目录: $TEMP_DIR${NC}"

# 复制文件
echo -e "${BLUE}复制文件...${NC}"
cp manifest.json "$TEMP_DIR/"
cp content.js "$TEMP_DIR/"
cp styles.css "$TEMP_DIR/"
cp icon16.png "$TEMP_DIR/"
cp icon48.png "$TEMP_DIR/"
cp icon128.png "$TEMP_DIR/"

# 创建 ZIP
echo -e "${BLUE}创建 ZIP 文件...${NC}"
cd "$TEMP_DIR"
zip -q -r "$OLDPWD/$PACKAGE_NAME" .
cd "$OLDPWD"

# 清理临时目录
rm -rf "$TEMP_DIR"

# 显示结果
FILE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 打包完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "文件名: ${BLUE}$PACKAGE_NAME${NC}"
echo -e "大小: ${BLUE}$FILE_SIZE${NC}"
echo -e "位置: ${BLUE}$(pwd)/$PACKAGE_NAME${NC}"
echo ""
echo -e "下一步："
echo -e "1. 访问 ${BLUE}https://chrome.google.com/webstore/devconsole${NC}"
echo -e "2. 上传 ${BLUE}$PACKAGE_NAME${NC}"
echo ""
