package source

import (
	"net/url"
	"regexp"
	"strings"
)

// 已知修饰后缀（无码、流出、字幕、清晰度、马赛克等）
var knownSuffixRegex = regexp.MustCompile(`(?i)(?:[-_](?:uncensored(?:[-_]leaked|[-_]leak)?|leaked|leak|chinese|sub|ch|c|4k|hd|fhd|reduced[-_]mosaic))+$`)

// 标准日系番号正则: 字母前缀 + 可选分隔符 + 数字编号
// 支持如 WSP-101, SSIS-888, MGS 体系如 300MAAN-001, DM 系列如 DM-339
var standardCodeRegex = regexp.MustCompile(`(?i)^([a-z]{2,8}|\d{3}[a-z]{2,6})[-_ ]*0*(\d+)$`)

// FC2 番号正则: FC2[-_ ]?(?:PPV)?[-_ ]?(\d+)
var fc2CodeRegex = regexp.MustCompile(`(?i)^(?:fc2[-_ ]*)?(?:ppv[-_ ]*)?(\d{5,8})$`)

// 日期型番号正则 (加勒比, 一本道等): 6位日期 + 分隔符 + 3位数字
var dateCodeRegex = regexp.MustCompile(`^(\d{6})[-_ ](\d{3})$`)

// Tokyo Hot 等纯字母+4位数字体系
var tokyoHotRegex = regexp.MustCompile(`(?i)^(cz|n|k)(\d{4})$`)

// CodeCore 表示番号的结构化核心信息
type CodeCore struct {
	Prefix string
	Number string
	Type   string
}

// ExtractCodeCore 提取番号的结构化核心组件
func ExtractCodeCore(raw string) (CodeCore, bool) {
	clean := strings.TrimSpace(raw)
	if clean == "" {
		return CodeCore{}, false
	}

	// 1. 若传入的是 URL 或路径，先提取末尾的 slug
	clean = ExtractSlug(clean)

	// 2. 去除末尾常见修饰后缀
	clean = knownSuffixRegex.ReplaceAllString(clean, "")
	clean = strings.TrimSpace(clean)

	// 3. FC2 体系判断
	if m := fc2CodeRegex.FindStringSubmatch(clean); len(m) > 1 {
		return CodeCore{
			Prefix: "FC2",
			Number: m[1],
			Type:   "FC2",
		}, true
	}

	// 4. 日期型体系判断
	if m := dateCodeRegex.FindStringSubmatch(clean); len(m) > 2 {
		return CodeCore{
			Prefix: m[1],
			Number: m[2],
			Type:   "DATE",
		}, true
	}

	// 5. Tokyo-Hot 体系判断
	if m := tokyoHotRegex.FindStringSubmatch(clean); len(m) > 2 {
		return CodeCore{
			Prefix: strings.ToUpper(m[1]),
			Number: m[2],
			Type:   "TOKYO_HOT",
		}, true
	}

	// 6. 标准日系番号判断
	if m := standardCodeRegex.FindStringSubmatch(clean); len(m) > 2 {
		num := m[2]
		if num == "" {
			num = "0"
		}
		return CodeCore{
			Prefix: strings.ToUpper(m[1]),
			Number: num,
			Type:   "STANDARD",
		}, true
	}

	return CodeCore{}, false
}

// ExtractSlug 从 URL、路径或字符串中提取纯 slug 标识
func ExtractSlug(raw string) string {
	s := strings.TrimSpace(raw)
	// 如果带有协议或路径
	if strings.Contains(s, "/") {
		if u, err := url.Parse(s); err == nil && u.Path != "" {
			s = u.Path
		}
		s = strings.TrimRight(s, "/")
		parts := strings.Split(s, "/")
		if len(parts) > 0 {
			s = parts[len(parts)-1]
		}
	}
	// 去除可能携带的 .html, .m3u8 扩展名
	if idx := strings.LastIndex(s, "."); idx != -1 && idx > len(s)-6 {
		s = s[:idx]
	}
	return strings.TrimSpace(s)
}

// IsEquivalentCode 判断两个番号或候选 slug 在语义上是否代表同一部影片
func IsEquivalentCode(targetCode, candidate string) bool {
	coreTarget, okTarget := ExtractCodeCore(targetCode)
	coreCandidate, okCandidate := ExtractCodeCore(candidate)

	// 若两者都能结构化解析，按结构化核心比对
	if okTarget && okCandidate {
		return coreTarget.Prefix == coreCandidate.Prefix &&
			coreTarget.Number == coreCandidate.Number &&
			coreTarget.Type == coreCandidate.Type
	}

	// 兜底非标准格式：去除所有连字符、下划线、空格与已知后缀后，纯文本大写全等比对
	cleanTarget := knownSuffixRegex.ReplaceAllString(ExtractSlug(targetCode), "")
	cleanCandidate := knownSuffixRegex.ReplaceAllString(ExtractSlug(candidate), "")

	normT := strings.ToUpper(strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(cleanTarget, "-", ""), "_", ""), " ", ""))
	normC := strings.ToUpper(strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(cleanCandidate, "-", ""), "_", ""), " ", ""))

	return normT != "" && normT == normC
}
