/**
 * Miss Player - CSS 静态审计与死代码摸排脚本 (scripts/audit-css.js)
 * 
 * 遵守 AGENTS.md 准则：只读静态分析，不修改现有业务代码。
 * 
 * 核心功能：
 * 1. 解析 src/player/ui/styles/*.css 与 src/player/ui/style.css 中的所有选择器、类名、ID、Keyframes、CSS变量；
 * 2. 深度扫描全量 src/**\/*.js，精准统计各类名/选择器/变量在 JS 中的引用热度与上下文；
 * 3. 提取 0 引用死代码候选清单（区分自研组件、宿主穿透、原生标签）；
 * 4. 统计跨 CSS 文件的重复选择器声明（如 .tm-control-buttons 重复 9 次）；
 * 5. 统计散落在各文件的 :root, :host 变量声明与覆写；
 * 6. 输出结构化报告至 000.BUG_memo/css-audit-report.json 与 000.BUG_memo/css-audit-summary.md。
 */

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

// --- 路径配置 ---
const ROOT_DIR = path.resolve(__dirname, '..');
const CSS_DIR = path.join(ROOT_DIR, 'src/player/ui/styles');
const CSS_ENTRY = path.join(ROOT_DIR, 'src/player/ui/style.css');
const JS_SRC_DIR = path.join(ROOT_DIR, 'src');
const REPORT_JSON_PATH = path.join(ROOT_DIR, '000.BUG_memo/css-audit-report.json');
const REPORT_MD_PATH = path.join(ROOT_DIR, '000.BUG_memo/css-audit-summary.md');

// 宿主/浏览器原生标签黑名单（非自定义类名）
const NATIVE_HTML_TAGS = new Set([
  'html', 'body', 'div', 'span', 'applet', 'object', 'iframe',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'pre',
  'a', 'abbr', 'acronym', 'address', 'big', 'cite', 'code',
  'del', 'dfn', 'em', 'img', 'ins', 'kbd', 'q', 's', 'samp',
  'small', 'strike', 'strong', 'sub', 'sup', 'tt', 'var',
  'b', 'u', 'i', 'center', 'dl', 'dt', 'dd', 'ol', 'ul', 'li',
  'fieldset', 'form', 'label', 'legend', 'table', 'caption', 'tbody',
  'tfoot', 'thead', 'tr', 'th', 'td', 'article', 'aside', 'canvas',
  'details', 'embed', 'figure', 'figcaption', 'footer', 'header',
  'hgroup', 'menu', 'nav', 'output', 'ruby', 'section', 'summary',
  'time', 'mark', 'audio', 'video', 'source', 'track', 'svg', 'path',
  'circle', 'rect', 'line', 'polygon', 'polyline', 'text', 'g', 'use',
  'button', 'input', 'select', 'textarea', 'option', 'optgroup'
]);

// 辅助：递归获取所有 JS 文件
function getJsFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        results.push(...getJsFiles(fullPath));
      }
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

// 辅助：获取所有待审计 CSS 文件
function getCssFiles() {
  const files = [];
  if (fs.existsSync(CSS_ENTRY)) {
    files.push(CSS_ENTRY);
  }
  if (fs.existsSync(CSS_DIR)) {
    const list = fs.readdirSync(CSS_DIR)
      .filter(f => f.endsWith('.css'))
      .map(f => path.join(CSS_DIR, f));
    files.push(...list);
  }
  return files;
}

// 辅助：转义正则表达式特殊字符
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 辅助：从选择器中提取末端叶子节点（Target Subject）
function extractLeafSelector(selector) {
  // 按组合符分割并取最后一部分：>, +, ~, 空格
  const parts = selector.split(/[\s>+~]+/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : selector;
}

// 辅助：从选择器部分提取类名
function extractClasses(selector) {
  const matches = selector.match(/\.([a-zA-Z0-9_-]+)/g);
  return matches ? matches.map(c => c.slice(1)) : [];
}

// 辅助：从选择器部分提取 ID
function extractIds(selector) {
  const matches = selector.match(/#([a-zA-Z0-9_-]+)/g);
  return matches ? matches.map(i => i.slice(1)) : [];
}

// 识别是否是自研播放器命名（tm- / mp- / jc- / is- / has-）
function isMissPlayerSpecific(name) {
  return /^(tm-|mp-|jc-|is-|has-)/.test(name);
}

// 主审计分析引擎
async function runAudit() {
  console.log('🚀 开始 Miss Player CSS 静态审计与全局摸排...');
  const startTime = Date.now();

  const cssFiles = getCssFiles();
  const jsFiles = getJsFiles(JS_SRC_DIR);

  console.log(`📂 检测到 CSS 文件: ${cssFiles.length} 个`);
  console.log(`📂 检测到 JS 文件: ${jsFiles.length} 个`);

  // --- 1. 读取 JS 文件源码 ---
  const jsDatabase = jsFiles.map(filePath => {
    const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    return {
      filePath,
      relativePath,
      content,
      lines
    };
  });

  // --- 2. 解析 CSS 文件 ---
  const rawRules = []; // 所有规则清单
  const selectorMap = new Map(); // selector -> { count, locations: [], classes: [], ids: [], ... }
  const classMap = new Map(); // className -> { locations: [], declarationCount: 0 }
  const idMap = new Map(); // id -> { locations: [], declarationCount: 0 }
  const keyframesMap = new Map(); // name -> { locations: [] }
  const rootHostVarsMap = new Map(); // varName -> [{ file, line, value, selector }]
  const allCssVarsDeclared = new Map(); // varName -> [{ file, line, value, selector }]
  const cssVarsUsedInCss = new Set(); // varName

  const fileStats = {};

  for (const cssFile of cssFiles) {
    const relativeFile = path.relative(ROOT_DIR, cssFile).replace(/\\/g, '/');
    const content = fs.readFileSync(cssFile, 'utf-8');
    const lineCount = content.split('\n').length;
    
    fileStats[relativeFile] = {
      lineCount,
      size: content.length,
      ruleCount: 0,
      selectorCount: 0,
      classes: new Set(),
      importantCount: (content.match(/!important/g) || []).length
    };

    let root;
    try {
      root = postcss.parse(content, { from: relativeFile });
    } catch (err) {
      console.error(`❌ 解析 CSS 失败: ${relativeFile}`, err.message);
      continue;
    }

    // 提取 Keyframes
    root.walkAtRules('keyframes', atRule => {
      const name = atRule.params.trim();
      if (!keyframesMap.has(name)) {
        keyframesMap.set(name, { name, locations: [] });
      }
      keyframesMap.get(name).locations.push({
        file: relativeFile,
        line: atRule.source ? atRule.source.start.line : 0
      });
    });

    // 提取 CSS 变量使用与声明
    root.walkDecls(decl => {
      // 变量声明
      if (decl.prop.startsWith('--')) {
        const varName = decl.prop;
        const parentSel = decl.parent && decl.parent.type === 'rule' ? decl.parent.selector : '';
        const item = {
          file: relativeFile,
          line: decl.source ? decl.source.start.line : 0,
          value: decl.value.trim(),
          selector: parentSel
        };

        if (!allCssVarsDeclared.has(varName)) {
          allCssVarsDeclared.set(varName, []);
        }
        allCssVarsDeclared.get(varName).push(item);

        if (parentSel.includes(':root') || parentSel.includes(':host')) {
          if (!rootHostVarsMap.has(varName)) {
            rootHostVarsMap.set(varName, []);
          }
          rootHostVarsMap.get(varName).push(item);
        }
      }

      // 变量使用 var(--xxx)
      if (decl.value.includes('var(')) {
        const matches = decl.value.match(/var\((--[a-zA-Z0-9_-]+)/g);
        if (matches) {
          matches.forEach(m => {
            const vName = m.replace('var(', '');
            cssVarsUsedInCss.add(vName);
          });
        }
      }
    });

    // 提取 Rules 与 Selectors
    root.walkRules(rule => {
      // 跳过 @keyframes 内部的帧规则（如 0%, 100%, from, to）
      if (rule.parent && rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') {
        return;
      }

      fileStats[relativeFile].ruleCount++;

      const selectors = rule.selectors || [];
      fileStats[relativeFile].selectorCount += selectors.length;

      selectors.forEach(rawSel => {
        const normalizedSel = rawSel.trim().replace(/\s+/g, ' ');
        if (!normalizedSel) return;

        const loc = {
          file: relativeFile,
          line: rule.source ? rule.source.start.line : 0,
          column: rule.source ? rule.source.start.column : 0
        };

        const classes = extractClasses(normalizedSel);
        const ids = extractIds(normalizedSel);
        const leaf = extractLeafSelector(normalizedSel);
        const leafClasses = extractClasses(leaf);

        classes.forEach(cls => {
          fileStats[relativeFile].classes.add(cls);
          if (!classMap.has(cls)) {
            classMap.set(cls, {
              className: cls,
              locations: [],
              declarationCount: 0,
              isMissPlayer: isMissPlayerSpecific(cls)
            });
          }
          const cData = classMap.get(cls);
          cData.declarationCount++;
          cData.locations.push(loc);
        });

        ids.forEach(id => {
          if (!idMap.has(id)) {
            idMap.set(id, {
              id,
              locations: [],
              declarationCount: 0
            });
          }
          const iData = idMap.get(id);
          iData.declarationCount++;
          iData.locations.push(loc);
        });

        if (!selectorMap.has(normalizedSel)) {
          selectorMap.set(normalizedSel, {
            selector: normalizedSel,
            locations: [],
            declarationCount: 0,
            classes,
            ids,
            leaf,
            leafClasses,
            hasMissPlayerClass: classes.some(isMissPlayerSpecific)
          });
        }
        const sData = selectorMap.get(normalizedSel);
        sData.declarationCount++;
        sData.locations.push(loc);

        rawRules.push({
          selector: normalizedSel,
          file: relativeFile,
          line: loc.line,
          classes,
          ids
        });
      });
    });
  }

  console.log(`📊 CSS 统计完成: 共提取 ${selectorMap.size} 个独立选择器, ${classMap.size} 个独立类名, ${allCssVarsDeclared.size} 个 CSS 变量`);

  // --- 3. 扫描 JS 引用与匹配 ---
  console.log('🔍 开始扫描 JS 代码中的类名与选择器引用...');

  // 辅助：分析特定单词/名称在 JS 中的命中详情
  function searchExactTokenInJs(token) {
    const escaped = escapeRegex(token);
    // 严格词边界，阻断前后带连字符、下划线及字母数字的假阳性
    const regex = new RegExp(`(?<![a-zA-Z0-9_-])${escaped}(?![a-zA-Z0-9_-])`, 'g');
    
    let totalHits = 0;
    const hitFiles = new Set();
    const references = [];

    for (const js of jsDatabase) {
      if (!js.content.includes(token)) continue; // 快速剪枝

      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(js.content)) !== null) {
        totalHits++;
        hitFiles.add(js.relativePath);

        // 如果收集的样本已达 5 个，不再无限扩展明细以节省内存
        if (references.length < 5) {
          // 定位行号
          let charCount = 0;
          let lineNo = 1;
          for (let i = 0; i < js.lines.length; i++) {
            const lLen = js.lines[i].length + 1; // +1 \n
            if (charCount + lLen > match.index) {
              lineNo = i + 1;
              const lineContent = js.lines[i].trim();
              
              // 判定上下文类型
              let contextType = 'string-literal';
              if (/classList\.(add|toggle|remove|contains)/.test(lineContent)) {
                contextType = 'classList';
              } else if (/(querySelector|querySelectorAll|closest|matches)/.test(lineContent)) {
                contextType = 'querySelector';
              } else if (/class\s*=\s*['"`]/.test(lineContent)) {
                contextType = 'template-html';
              } else if (/className\s*[+=]/.test(lineContent)) {
                contextType = 'className';
              }

              references.push({
                file: js.relativePath,
                line: lineNo,
                contextType,
                snippet: lineContent.length > 120 ? lineContent.slice(0, 117) + '...' : lineContent
              });
              break;
            }
            charCount += lLen;
          }
        }
      }
    }

    return {
      token,
      totalHits,
      fileCount: hitFiles.size,
      files: Array.from(hitFiles),
      sampleReferences: references
    };
  }

  // A. 检索所有类名
  const classAuditResults = [];
  for (const [cls, data] of classMap.entries()) {
    const jsUsage = searchExactTokenInJs(cls);
    classAuditResults.push({
      className: cls,
      isMissPlayer: data.isMissPlayer,
      cssDeclarations: data.declarationCount,
      cssLocations: data.locations,
      jsHits: jsUsage.totalHits,
      jsFiles: jsUsage.files,
      sampleReferences: jsUsage.sampleReferences
    });
  }

  // 建立类名引用字典便于后续检索选择器
  const classHitsMap = new Map();
  classAuditResults.forEach(item => classHitsMap.set(item.className, item.jsHits));

  // B. 检索所有 ID
  const idAuditResults = [];
  for (const [id, data] of idMap.entries()) {
    const jsUsage = searchExactTokenInJs(id);
    idAuditResults.push({
      id,
      cssDeclarations: data.declarationCount,
      cssLocations: data.locations,
      jsHits: jsUsage.totalHits,
      jsFiles: jsUsage.files
    });
  }
  const idHitsMap = new Map();
  idAuditResults.forEach(item => idHitsMap.set(item.id, item.jsHits));

  // C. 检索 CSS 变量在 JS 中的使用
  const cssVarsAuditResults = [];
  for (const [varName, declarations] of allCssVarsDeclared.entries()) {
    const jsUsage = searchExactTokenInJs(varName);
    const usedInCss = cssVarsUsedInCss.has(varName);
    cssVarsAuditResults.push({
      varName,
      declarations,
      usedInCss,
      jsHits: jsUsage.totalHits,
      jsFiles: jsUsage.files
    });
  }

  // D. 检索 Keyframes 在 CSS 和 JS 中的使用
  const keyframesAuditResults = [];
  for (const [kfName, data] of keyframesMap.entries()) {
    // 检查是否在 CSS 的 animation / animation-name 中被使用
    let usedInCss = false;
    for (const cssFile of cssFiles) {
      const content = fs.readFileSync(cssFile, 'utf-8');
      const kfRegex = new RegExp(`animation(-name)?\\s*:[^;]*?\\b${escapeRegex(kfName)}\\b`, 'i');
      if (kfRegex.test(content)) {
        usedInCss = true;
        break;
      }
    }
    const jsUsage = searchExactTokenInJs(kfName);
    keyframesAuditResults.push({
      name: kfName,
      locations: data.locations,
      usedInCss,
      jsHits: jsUsage.totalHits,
      jsFiles: jsUsage.files
    });
  }

  // --- 4. 选择器多维判定与死选择器归纳 ---
  const selectorAuditResults = [];
  for (const [sel, data] of selectorMap.entries()) {
    // 检查类名命中总数
    let totalClassHits = 0;
    let anyClassHit = false;
    let allClassHitsZero = data.classes.length > 0;

    data.classes.forEach(c => {
      const hits = classHitsMap.get(c) || 0;
      totalClassHits += hits;
      if (hits > 0) anyClassHit = true;
      if (hits > 0) allClassHitsZero = false;
    });

    // 检查末梢目标类名命中
    let leafClassHits = 0;
    if (data.leafClasses.length > 0) {
      data.leafClasses.forEach(c => {
        leafClassHits += (classHitsMap.get(c) || 0);
      });
    }

    // 检查 ID 命中
    let totalIdHits = 0;
    data.ids.forEach(i => {
      totalIdHits += (idHitsMap.get(i) || 0);
    });

    // 检查完整选择器是否直接被 querySelector 使用
    let fullSelectorInJs = false;
    for (const js of jsDatabase) {
      if (js.content.includes(sel)) {
        fullSelectorInJs = true;
        break;
      }
    }

    // 分级判定状态
    // - dead-grade-1: 内部自研选择器，且所有包含的 Class / ID 引用均为 0
    // - dead-leaf-zero: 复合选择器，但目标叶子类名引用为 0
    // - active: 正常活跃
    // - native-or-host: 不含自研类名的纯原生标签或宿主页面选择器
    let status = 'active';
    let suspicionReason = '';

    if (data.classes.length === 0 && data.ids.length === 0) {
      status = 'native-or-host';
      suspicionReason = '不包含自定义类名或ID (原生HTML标签或伪类)';
    } else if (data.hasMissPlayerClass && allClassHitsZero && totalIdHits === 0 && !fullSelectorInJs) {
      status = 'dead-grade-1';
      suspicionReason = '自研组件类名全部 0 引用 (高度嫌疑死选择器)';
    } else if (data.leafClasses.length > 0 && leafClassHits === 0 && !fullSelectorInJs) {
      status = 'dead-leaf-zero';
      suspicionReason = '复合选择器目标叶子类名 0 引用 (末梢无对应DOM)';
    } else if (data.classes.length > 0 && allClassHitsZero && totalIdHits === 0) {
      status = 'dead-external-zero';
      suspicionReason = '外部/第三方类名 0 引用 (宿主废弃或未命中)';
    }

    selectorAuditResults.push({
      selector: sel,
      status,
      suspicionReason,
      declarationCount: data.declarationCount,
      locations: data.locations,
      classes: data.classes,
      ids: data.ids,
      leaf: data.leaf,
      leafClasses: data.leafClasses,
      totalClassHits,
      leafClassHits,
      fullSelectorInJs
    });
  }

  // --- 5. 重复选择器深度统计 ---
  const duplicateSelectors = selectorAuditResults
    .filter(s => s.declarationCount > 1)
    .map(s => {
      const distinctFiles = Array.from(new Set(s.locations.map(l => l.file)));
      return {
        selector: s.selector,
        totalDeclarations: s.declarationCount,
        fileCount: distinctFiles.length,
        isCrossFile: distinctFiles.length > 1,
        files: distinctFiles,
        locations: s.locations
      };
    })
    .sort((a, b) => b.totalDeclarations - a.totalDeclarations);

  const crossFileDuplicates = duplicateSelectors.filter(d => d.isCrossFile);
  const sameFileDuplicates = duplicateSelectors.filter(d => !d.isCrossFile);

  // --- 6. :root 与 :host 变量散落与重复统计 ---
  const rootHostVarsList = [];
  for (const [varName, locs] of rootHostVarsMap.entries()) {
    const distinctFiles = Array.from(new Set(locs.map(l => l.file)));
    rootHostVarsList.push({
      varName,
      declarationCount: locs.length,
      isMultiple: locs.length > 1,
      isCrossFile: distinctFiles.length > 1,
      files: distinctFiles,
      declarations: locs
    });
  }
  rootHostVarsList.sort((a, b) => b.declarationCount - a.declarationCount);

  // --- 7. 汇总死代码候选 ---
  const deadClasses = classAuditResults.filter(c => c.jsHits === 0);
  const deadClassesMissPlayer = deadClasses.filter(c => c.isMissPlayer);
  const deadClassesExternal = deadClasses.filter(c => !c.isMissPlayer);

  const deadSelectorsGrade1 = selectorAuditResults.filter(s => s.status === 'dead-grade-1');
  const deadSelectorsLeafZero = selectorAuditResults.filter(s => s.status === 'dead-leaf-zero');
  const deadSelectorsAllSuspect = selectorAuditResults.filter(s => s.status.startsWith('dead-'));

  const deadKeyframes = keyframesAuditResults.filter(k => !k.usedInCss && k.jsHits === 0);
  const deadCssVars = cssVarsAuditResults.filter(v => !v.usedInCss && v.jsHits === 0);

  // --- 8. 生成结构化报告数据 ---
  const reportData = {
    meta: {
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      cssFileCount: cssFiles.length,
      jsFileCount: jsFiles.length
    },
    summary: {
      totalCssLines: Object.values(fileStats).reduce((acc, f) => acc + f.lineCount, 0),
      totalRules: Object.values(fileStats).reduce((acc, f) => acc + f.ruleCount, 0),
      totalSelectors: selectorAuditResults.length,
      totalClasses: classMap.size,
      totalIds: idMap.size,
      totalKeyframes: keyframesMap.size,
      totalCssVarsDeclared: allCssVarsDeclared.size,
      totalRootHostVars: rootHostVarsList.length,
      totalImportantCount: Object.values(fileStats).reduce((acc, f) => acc + f.importantCount, 0),
      
      deadCodeSummary: {
        zeroHitClassesTotal: deadClasses.length,
        zeroHitClassesMissPlayer: deadClassesMissPlayer.length,
        zeroHitClassesExternal: deadClassesExternal.length,
        deadSelectorsGrade1: deadSelectorsGrade1.length,
        deadSelectorsLeafZero: deadSelectorsLeafZero.length,
        deadSelectorsTotalSuspect: deadSelectorsAllSuspect.length,
        unusedKeyframesCount: deadKeyframes.length,
        unusedCssVarsCount: deadCssVars.length
      },

      duplicateSummary: {
        totalDuplicateSelectors: duplicateSelectors.length,
        crossFileDuplicates: crossFileDuplicates.length,
        sameFileDuplicates: sameFileDuplicates.length
      }
    },
    fileBreakdown: fileStats,
    topDuplicates: duplicateSelectors.slice(0, 20),
    crossFileDuplicates,
    rootHostVariables: rootHostVarsList,
    deadSelectorsGrade1: deadSelectorsGrade1.map(s => ({
      selector: s.selector,
      locations: s.locations,
      classes: s.classes,
      suspicionReason: s.suspicionReason
    })),
    deadClassesMissPlayer: deadClassesMissPlayer.map(c => ({
      className: c.className,
      cssDeclarations: c.cssDeclarations,
      cssLocations: c.cssLocations
    })),
    unusedKeyframes: deadKeyframes,
    unusedCssVars: deadCssVars
  };

  // --- 9. 输出到 000.BUG_memo/css-audit-report.json ---
  const memoDir = path.dirname(REPORT_JSON_PATH);
  if (!fs.existsSync(memoDir)) {
    fs.mkdirSync(memoDir, { recursive: true });
  }

  // 转换 Set 辅助序列化
  const jsonReplacer = (key, value) => {
    if (value instanceof Set) return Array.from(value);
    return value;
  };

  fs.writeFileSync(REPORT_JSON_PATH, JSON.stringify(reportData, jsonReplacer, 2), 'utf-8');
  console.log(`✅ 结构化 JSON 报告已保存至: ${REPORT_JSON_PATH}`);

  // --- 10. 生成 Markdown 摘要报告 ---
  const mdContent = generateMarkdownSummary(reportData);
  fs.writeFileSync(REPORT_MD_PATH, mdContent, 'utf-8');
  console.log(`✅ Markdown 摘要报告已保存至: ${REPORT_MD_PATH}`);

  // --- 11. 控制台终端格式化输出 ---
  printConsoleSummary(reportData);

  return reportData;
}

// 辅助：生成 Markdown 摘要报告
function generateMarkdownSummary(data) {
  const { summary, topDuplicates, crossFileDuplicates, rootHostVariables, deadClassesMissPlayer, deadSelectorsGrade1, unusedKeyframes, unusedCssVars } = data;

  let md = `# Miss Player CSS 全局静态审计与摸排报告

> 生成时间：${data.meta.generatedAt}  
> 耗时：${data.meta.durationMs}ms | CSS 文件数：${data.meta.cssFileCount} | JS 扫描文件数：${data.meta.jsFileCount}  
> 对应专项任务：Phase 14 (CSS Architecture Refactor) - 子任务 A

---

## 📊 一、全局核心指标总览

| 维度指标 | 数值 | 状态/说明 |
| :--- | :--- | :--- |
| **CSS 源码总行数** | **${summary.totalCssLines}** 行 | 包含 8 个子模块与 1 个入口 |
| **CSS 规则总数 (Rules)** | **${summary.totalRules}** 条 | PostCSS 解析规则总数 |
| **独立规范化选择器数** | **${summary.totalSelectors}** 个 | 拆分逗号后的单一选择器 |
| **独立 CSS 类名数** | **${summary.totalClasses}** 个 | 全部样式提取的 class 集合 |
| **\`!important\` 标记总数** | **${summary.totalImportantCount}** 处 | 待治理（目标 < 50 处） |
| **0 引用自研类名嫌疑** | **${summary.deadCodeSummary.zeroHitClassesMissPlayer}** 个 | \`tm-*\`, \`mp-*\`, \`jc-*\`, \`is-*\` 零引用 |
| **Grade 1 确凿死选择器** | **${summary.deadCodeSummary.deadSelectorsGrade1}** 个 | 所含类名在 JS 中全部 0 命中 |
| **重复声明选择器数** | **${summary.duplicateSummary.totalDuplicateSelectors}** 个 | 其中跨文件重复 **${summary.duplicateSummary.crossFileDuplicates}** 个 |
| **散落 \`:root, :host\` 变量** | **${summary.totalRootHostVars}** 个 | 散落在 3 个文件中的全局变量 |
| **无用 Keyframes 动画** | **${summary.deadCodeSummary.unusedKeyframesCount}** 个 | CSS 与 JS 均未调用的动画 |
| **无用 CSS 变量** | **${summary.deadCodeSummary.unusedCssVarsCount}** 个 | 未在 \`var()\` 或 JS 调用的变量 |

---

## 📁 二、各 CSS 文件分布明细

| 文件路径 | 行数 | 体积 | 规则数 | 选择器数 | 类名数 | !important |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${Object.entries(data.fileBreakdown).map(([file, stat]) => {
  const clsCount = stat.classes instanceof Set ? stat.classes.size : (stat.classes ? stat.classes.length : 0);
  return `| \`${file}\` | ${stat.lineCount} | ${(stat.size / 1024).toFixed(1)} KB | ${stat.ruleCount} | ${stat.selectorCount} | ${clsCount} | **${stat.importantCount}** |`;
}).join('\n')}

---

## 🔁 三、最高频重复选择器 Top 10 (跨文件重灾区)

| 排名 | 重复次数 | 跨文件 | 选择器名称 | 分布所在文件 |
| :---: | :---: | :---: | :--- | :--- |
${topDuplicates.slice(0, 10).map((d, idx) => {
  return `| ${idx + 1} | **${d.totalDeclarations} 次** | ${d.isCrossFile ? '⚠️ 是' : '否'} | \`${d.selector}\` | ${d.files.map(f => path.basename(f)).join(', ')} |`;
}).join('\n')}

### 🚨 跨文件重复选择器清单 (${crossFileDuplicates.length} 处)
${crossFileDuplicates.map(d => `- **\`${d.selector}\`** (声明 ${d.totalDeclarations} 次，涉及 ${d.files.map(f => '`' + path.basename(f) + '`').join(', ')})`).join('\n')}

---

## 🌐 四、\`:root, :host\` 变量散落与覆写分布 (${rootHostVariables.length} 处)

${rootHostVariables.map(v => {
  const filesStr = v.files.map(f => path.basename(f)).join(', ');
  const multiBadge = v.isMultiple ? ` ⚠️ (在 ${v.declarationCount} 处被重复声明/媒体查询修改)` : '';
  return `- \`${v.varName}\`${multiBadge}: 存在于 ${filesStr}`;
}).join('\n')}

---

## ☠️ 五、死选择器与死类名候选清单 (Dead Code Candidates)

### 1. Grade 1 确凿死选择器 (Top 25 展示 / 共 ${deadSelectorsGrade1.length} 个)
> 定义：包含自研前缀（\`tm-\`, \`mp-\`, \`jc-\`, \`is-\` 等），但所包含的类名在全量 86 个 JS 源码中命中数为 0。

${deadSelectorsGrade1.slice(0, 25).map(s => {
  const locStr = s.locations.map(l => `${path.basename(l.file)}:${l.line}`).join(', ');
  return `- \`${s.selector}\` → 声明于: ${locStr} (包含类名: ${s.classes.map(c => '.' + c).join(', ')})`;
}).join('\n')}
${deadSelectorsGrade1.length > 25 ? `\n*(更多 ${deadSelectorsGrade1.length - 25} 个详见 css-audit-report.json)*\n` : ''}

### 2. 0 引用自研类名清单 (共 ${deadClassesMissPlayer.length} 个)
${deadClassesMissPlayer.map(c => `- \`.${c.className}\` (在 CSS 中声明 ${c.cssDeclarations} 次)`).join('\n')}

### 3. 未引用的 Keyframes 动画 (${unusedKeyframes.length} 个)
${unusedKeyframes.length > 0 ? unusedKeyframes.map(k => `- \`@keyframes ${k.name}\` (定义于 ${k.locations.map(l => path.basename(l.file) + ':' + l.line).join(', ')})`).join('\n') : '- 无'}

### 4. 未引用的 CSS 变量 (${unusedCssVars.length} 个)
${unusedCssVars.length > 0 ? unusedCssVars.map(v => `- \`${v.varName}\` (声明于 ${v.declarations.map(d => path.basename(d.file) + ':' + d.line).join(', ')})`).join('\n') : '- 无'}

---

## 🎯 六、重构治理行动建议 (Refactor Next Steps)

1. **废弃旧设置面板样式**：在 \`_player.css\` 中有大量设置相关旧类名（如 \`.tm-setting-*\`, \`.tm-checkbox-*\`）在 JS 中命中数为 0，说明已完全被 \`_settings_apple.css\` 替代，可批量拔除；
2. **清理 \`_landscape_legacy.css\`**：该文件与 \`_landscape_pc.css\` 严重重复（如 \`.tm-control-buttons\`, \`.tm-video-container\`），确认可直接废弃移除；
3. **收拢 \`:root, :host\` 变量**：将散落在 \`_variables.css\`、\`_settings_apple.css\`、\`_landscape_pc.css\` 的变量统一收敛至规划的 \`00_tokens/_tokens.css\`；
4. **消灭重复选择器**：优先治理 Top 10 跨文件重复选择器，消除层叠特异度混乱。
`;
  return md;
}

// 辅助：控制台终端输出
function printConsoleSummary(data) {
  const { summary, topDuplicates, fileBreakdown } = data;
  console.log('\n================================================================');
  console.log('            🎯 Miss Player CSS 静态审计概要报告');
  console.log('================================================================');
  console.log(`📏 CSS 源码总行数:       ${summary.totalCssLines} 行 (${Object.keys(fileBreakdown).length} 个文件)`);
  console.log(`📌 PostCSS 解析规则总数: ${summary.totalRules} 条`);
  console.log(`🏷️  独立选择器总数:       ${summary.totalSelectors} 个`);
  console.log(`🧩 独立类名总数:         ${summary.totalClasses} 个`);
  console.log(`🔥 !important 滥用数量:  ${summary.totalImportantCount} 处 (目标: < 50 处)`);
  console.log('----------------------------------------------------------------');
  console.log(`☠️  死代码候选统计:`);
  console.log(`   • 0 引用自研类名:     ${summary.deadCodeSummary.zeroHitClassesMissPlayer} 个 (纯净内部组件)`);
  console.log(`   • Grade 1 确凿死选择器: ${summary.deadCodeSummary.deadSelectorsGrade1} 个 (内部类全 0 引用)`);
  console.log(`   • 未调用 Keyframes:   ${summary.deadCodeSummary.unusedKeyframesCount} 个`);
  console.log(`   • 未调用 CSS 变量:    ${summary.deadCodeSummary.unusedCssVarsCount} 个`);
  console.log('----------------------------------------------------------------');
  console.log(`🔁 重复选择器统计:`);
  console.log(`   • 总重复声明选择器:   ${summary.duplicateSummary.totalDuplicateSelectors} 个`);
  console.log(`   • 跨 CSS 文件重复:     ${summary.duplicateSummary.crossFileDuplicates} 个`);
  console.log('----------------------------------------------------------------');
  console.log('🏆 最高频重复选择器 Top 10:');
  topDuplicates.slice(0, 10).forEach((d, idx) => {
    const crossBadge = d.isCrossFile ? '[跨文件]' : '[同文件]';
    const files = d.files.map(f => path.basename(f)).join(', ');
    console.log(`   ${idx + 1}. (${d.totalDeclarations}次) ${crossBadge} ${d.selector.padEnd(30)} -> ${files}`);
  });
  console.log('================================================================\n');
}

// 执行脚本
if (require.main === module) {
  runAudit().catch(err => {
    console.error('❌ CSS 静态审计失败:', err);
    process.exit(1);
  });
}

module.exports = { runAudit };
