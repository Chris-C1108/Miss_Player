package source

import (
	"testing"
)

func TestMatcher(t *testing.T) {
	tests := []struct {
		name      string
		target    string
		candidate string
		want      bool
	}{
		// 1. 核心问题场景：WSP-101 绝不能匹配 WSP-160
		{
			name:      "WSP-101 vs wsp-160 (必须严格区分)",
			target:    "WSP-101",
			candidate: "wsp-160",
			want:      false,
		},
		{
			name:      "WSP-101 vs /cn/v/wsp-160 (从路径提取后比对)",
			target:    "WSP-101",
			candidate: "/cn/v/wsp-160",
			want:      false,
		},
		{
			name:      "WSP-101 vs nhdta-896 (不同厂牌)",
			target:    "WSP-101",
			candidate: "nhdta-896",
			want:      false,
		},
		{
			name:      "WSP-101 vs wsp-1010 (子串假阳性防护)",
			target:    "WSP-101",
			candidate: "wsp-1010",
			want:      false,
		},
		{
			name:      "WSP-101 vs awsp-101 (前缀不同)",
			target:    "WSP-101",
			candidate: "awsp-101",
			want:      false,
		},

		// 2. 正确等价变体
		{
			name:      "WSP-101 vs wsp-101 (大小写差异)",
			target:    "WSP-101",
			candidate: "wsp-101",
			want:      true,
		},
		{
			name:      "WSP-101 vs wsp101 (紧凑格式)",
			target:    "WSP-101",
			candidate: "wsp101",
			want:      true,
		},
		{
			name:      "WSP-101 vs wsp_101 (下划线)",
			target:    "WSP-101",
			candidate: "wsp_101",
			want:      true,
		},
		{
			name:      "WSP-101 vs wsp-00101 (前导零归一)",
			target:    "WSP-101",
			candidate: "wsp-00101",
			want:      true,
		},
		{
			name:      "WSP-00101 vs wsp-101 (逆向前导零)",
			target:    "WSP-00101",
			candidate: "wsp-101",
			want:      true,
		},
		{
			name:      "WSP-101 vs /cn/v/wsp-101-uncensored-leaked (无码流出修饰词)",
			target:    "WSP-101",
			candidate: "/cn/v/wsp-101-uncensored-leaked",
			want:      true,
		},
		{
			name:      "WSP-101 vs https://missav.ai/cn/dm13/wsp-101 (MissAV 分类路径)",
			target:    "WSP-101",
			candidate: "https://missav.ai/cn/dm13/wsp-101",
			want:      true,
		},
		{
			name:      "WSP-101 vs wsp-101-c (中文字幕修饰词)",
			target:    "WSP-101",
			candidate: "wsp-101-c",
			want:      true,
		},
		{
			name:      "WSP-101 vs wsp-101-ch (中文字幕修饰词)",
			target:    "WSP-101",
			candidate: "wsp-101-ch",
			want:      true,
		},

		// 3. FC2 体系
		{
			name:      "FC2-PPV-2849102 vs fc2-2849102",
			target:    "FC2-PPV-2849102",
			candidate: "fc2-2849102",
			want:      true,
		},
		{
			name:      "FC2-PPV-2849102 vs ppv-2849102",
			target:    "FC2-PPV-2849102",
			candidate: "ppv-2849102",
			want:      true,
		},
		{
			name:      "FC2-PPV-2849102 vs fc2-ppv-2849103",
			target:    "FC2-PPV-2849102",
			candidate: "fc2-ppv-2849103",
			want:      false,
		},

		// 4. MGS 体系
		{
			name:      "300MAAN-001 vs 300maan-1",
			target:    "300MAAN-001",
			candidate: "300maan-1",
			want:      true,
		},
		{
			name:      "300MAAN-001 vs 300maan-002",
			target:    "300MAAN-001",
			candidate: "300maan-002",
			want:      false,
		},

		// 5. 日期型体系
		{
			name:      "010123-123 vs 010123_123",
			target:    "010123-123",
			candidate: "010123_123",
			want:      true,
		},
		{
			name:      "010123-123 vs 010123-124",
			target:    "010123-123",
			candidate: "010123-124",
			want:      false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := IsEquivalentCode(tt.target, tt.candidate)
			if got != tt.want {
				t.Errorf("IsEquivalentCode(%q, %q) = %v, want %v", tt.target, tt.candidate, got, tt.want)
			}
		})
	}
}
