package source

import (
	"regexp"
	"strconv"
	"strings"
)

var (
	// 匹配 P.A.C.K.E.R. 模式: eval(function(p,a,c,k,e,d)...}('payload', a, c, 'words'.split('|'), ...)
	rePacker = regexp.MustCompile(`\}\s*\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:[^'\\]|\\.)*)'\.split\('\|'\)`)
	reWord   = regexp.MustCompile(`\b\w+\b`)
)

// UnpackJavaScript 解包 Dean Edwards P.A.C.K.E.R. 混淆代码
func UnpackJavaScript(packed string) string {
	matches := rePacker.FindAllStringSubmatch(packed, -1)
	if len(matches) == 0 {
		return packed
	}

	result := packed
	for _, m := range matches {
		if len(m) < 5 {
			continue
		}

		payload := m[1]
		radix, err1 := strconv.Atoi(m[2])
		count, err2 := strconv.Atoi(m[3])
		rawKeywords := m[4]

		if err1 != nil || err2 != nil || radix <= 0 || radix > 62 {
			continue
		}

		keywords := strings.Split(rawKeywords, "|")
		if len(keywords) < count {
			count = len(keywords)
		}

		// 字符替换词典
		lookup := make(map[string]string)
		for i := 0; i < count; i++ {
			word := keywords[i]
			if word != "" {
				key := intToBase(i, radix)
				lookup[key] = word
			}
		}

		// 执行反解替换
		unpacked := reWord.ReplaceAllStringFunc(payload, func(match string) string {
			if replacement, ok := lookup[match]; ok {
				return replacement
			}
			return match
		})

		// 清洗反斜杠转义
		unpacked = strings.ReplaceAll(unpacked, `\"`, `"`)
		unpacked = strings.ReplaceAll(unpacked, `\'`, `'`)
		unpacked = strings.ReplaceAll(unpacked, `\\`, `\`)

		result = strings.Replace(result, m[0], unpacked, 1)
	}

	return result
}

// intToBase 将整数转为指定进制的字符串 (支持 2-62 进制)
func intToBase(num int, base int) string {
	if num == 0 {
		return "0"
	}
	const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	if base > len(chars) {
		base = len(chars)
	}

	var sb strings.Builder
	for num > 0 {
		rem := num % base
		sb.WriteByte(chars[rem])
		num /= base
	}

	// 反转字符串
	runes := []rune(sb.String())
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}
	return string(runes)
}
