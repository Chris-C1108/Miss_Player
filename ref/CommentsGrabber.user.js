// ==UserScript==
// @name         通用型评论采集器
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在任何网站输入关键词(如same-121)自动搜索并采集相关评论
// @author       You
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_notification
// @connect      jable.tv
// @connect      *
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// ==/UserScript==

(function() {
    'use strict';
    
    // 评论过滤函数 - 过滤包含学校名称或不良内容的评论
    function filterInappropriateComments(input) {
        // 学校名列表
        const schoolNames = [
            '中大壢中', '中壢高中', '金門高中', '道明中學', '台南一中', 
            '大明高中', '珊瑚高中', '南港高中', '建國中學', '新店高中', '靜宜大學'
        ];
        
        // 创建学校名的正则表达式 - 使用单词边界确保完整匹配
        const schoolPattern = new RegExp(`(${schoolNames.join('|')})`, 'i');
        
        // 创建不良内容的正则表达式 - 扩展匹配模式
        const inappropriatePattern = /不要.*尻了|不要再尻了|不要再.*尻了|別.*尻了|別再尻了|不要.*打手槍|不要再不上課在家尻了/i;
        
        // 检查是否包含学校名或不良内容
        if (schoolPattern.test(input) || inappropriatePattern.test(input)) {
            return ''; // 如果同时包含学校名或不良内容，返回空字符串
        }
        
        return input; // 否则返回原始输入
    }
    
    // 从评论中提取时间标签
    function convertCommentsToTimes(input) {
        // 先过滤不适当的评论
        input = filterInappropriateComments(input);
        
        // 匹配番号格式的正则表达式：3-4位字母 + 可选的中横线 + 3位数字
        const productCodeRegex = /[A-Za-z]{3,4}-?\d{3}/g;
        
        // 提取所有番号并保存
        const productCodes = [];
        let cleanedInput = input;
        
        // 使用正则表达式的exec方法逐个匹配，以便获取匹配位置
        let match;
        while ((match = productCodeRegex.exec(input)) !== null) {
            const code = match[0];
            productCodes.push(`# ${code}`);
            
            // 在原字符串中将番号替换为空格，保持字符串长度不变
            // 这样可以避免替换后影响其他匹配的位置
            cleanedInput = cleanedInput.substring(0, match.index) + 
                        ' '.repeat(code.length) + 
                        cleanedInput.substring(match.index + code.length);
        }
        
        // 匹配时间格式的正则表达式，包括负数时间
        const timeRegex = /-?(?:\d+[.:：]?)+\d+/g;
        const timeMatches = cleanedInput.match(timeRegex) || [];
        
        // 返回番号和时间的结合
        return [
            ...productCodes,
            ...timeMatches.map(match => parseTime(match)).filter(t => t !== null)
        ];
    }

    function parseTime(timeStr) {
        // 处理负号
        const isNegative = timeStr.startsWith('-');
        if (isNegative) {
            timeStr = timeStr.substring(1);
        }

        // 清理并替换中文冒号
        timeStr = timeStr.replace(/[^\d.:：]/g, '').replace(/：/g, ':');

        // 分割部分
        let parts = timeStr.split(/[.:]/);
        if (parts.length === 1) {
            const numStr = parts[0];
            const len = numStr.length;
            parts = [];
            switch (len) {
                case 1:
                case 2:
                    // 单个数字或两位数，按照规则判断
                    // 如果数字>=5，认为是分钟
                    const num = parseInt(numStr, 10);
                    if (num >= 5 && num < 60) {
                        parts = ['0', numStr.padStart(2, '0'), '00'];
                    } else if (num < 5) {
                        // 小于5，认为是小时
                        parts = [numStr.padStart(2, '0'), '00', '00'];
                    } else if (num >= 60) {
                        // 大于等于60，认为是分秒
                        parts = ['0', '00', numStr.padStart(2, '0')];
                    }
                    break;
                case 3:
                    // 三位数，如167 -> 01:07:00 (1分07秒)
                    if (numStr[0] <= '9') {
                        parts = ['0', numStr[0], numStr.substring(1, 3)];
                    } else {
                        return null;
                    }
                    break;
                case 4:
                    // 四位数，如1045 -> 00:10:45
                    parts = ['0', numStr.substring(0, 2), numStr.substring(2, 4)];
                    break;
                case 5:
                    // 五位数，如12345 -> 01:23:45
                    parts = [numStr[0], numStr.substring(1, 3), numStr.substring(3, 5)];
                    break;
                case 6:
                    // 六位数，如123456 -> 12:34:56
                    parts = [numStr.substring(0, 2), numStr.substring(2, 4), numStr.substring(4, 6)];
                    break;
                default:
                    return null;
            }
            
            // 确保parts有值，如果没有生成有效的parts，则返回null
            if (parts.length === 0) {
                return null;
            }
        } else if (parts.length === 2) {
            // 处理 1.06 或 1:06 格式
            const hour = parseInt(parts[0], 10);
            const minute = parseInt(parts[1], 10);
            
            // 根据题目要求，如果第一部分小于10，且第二部分为分钟(<=59)
            // 则认为是小时:分钟
            if (hour < 10 && minute <= 59) {
                parts = [parts[0].padStart(2, '0'), parts[1].padStart(2, '0'), '00'];
            } else if (hour >= 11 && hour < 60 && minute < 60) {
                // 如果第一部分是11-59，则认为是分钟:秒钟
                parts = ['00', parts[0].padStart(2, '0'), parts[1].padStart(2, '0')];
            } else {
                // 其他情况可能无效
                return null;
            }
        } else {
            // 处理有三部分的情况，如1:30:45
            while (parts.length < 3) parts.push('0');
            parts = parts.slice(0, 3);
        }

        // 转换为数字并处理补零
        let [hours, minutes, seconds] = parts.map(p => parseInt(p || 0, 10));

        // 检查数值范围
        if (hours > 9 || minutes >= 60 || seconds >= 60) {
            // 如果分钟或秒钟大于等于60，直接判定为无效
            return null;
        }

        // 格式化
        const formatted = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');

        return (isNegative ? '-' : '') + formatted;
    }
    
    // 支持的网站配置
    const SITE_CONFIGS = {
        'jable.tv': {
            name: 'Jable',
            urlPattern: 'https://jable.tv/videos/{code}/',
            commentSelector: '#video_comments_video_comments_items .item',
            authorSelector: 'a[title]',
            authorLinkSelector: 'a[href*="/members/"]',
            dateSelector: 'span.inactive-color',
            contentSelector: 'p.comment-text span.original-text',
            commentsPerPage: 5 // 每页显示的评论数量
        }
        // 可以添加更多网站的配置
    };
    
    // 创建控制面板
    function createControlPanel() {
        // 避免重复创建
        if (document.getElementById('comments-grabber-panel')) {
            return;
        }
        
        const panel = document.createElement('div');
        panel.id = 'comments-grabber-panel';
        panel.style.position = 'fixed';
        panel.style.top = '10px';
        panel.style.right = '10px';
        panel.style.zIndex = '10000';
        panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        panel.style.padding = '10px';
        panel.style.borderRadius = '5px';
        panel.style.color = 'white';
        panel.style.maxWidth = '300px';
        panel.style.fontFamily = 'Arial, sans-serif';
        panel.style.fontSize = '14px';
        
        const title = document.createElement('div');
        title.textContent = '评论采集器';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '10px';
        title.style.borderBottom = '1px solid #555';
        title.style.paddingBottom = '5px';
        
        const inputWrapper = document.createElement('div');
        inputWrapper.style.display = 'flex';
        inputWrapper.style.marginBottom = '10px';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'comments-grabber-input';
        input.placeholder = '输入关键词，例如: same-121';
        input.style.flex = '1';
        input.style.marginRight = '5px';
        input.style.padding = '5px';
        input.style.borderRadius = '3px';
        input.style.border = 'none';
        
        const button = document.createElement('button');
        button.textContent = '采集';
        button.id = 'comments-grabber-button';
        button.style.padding = '5px 10px';
        button.style.cursor = 'pointer';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '3px';
        
        const statusDiv = document.createElement('div');
        statusDiv.id = 'comments-grabber-status';
        statusDiv.style.marginTop = '5px';
        statusDiv.style.padding = '5px';
        statusDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        statusDiv.style.borderRadius = '3px';
        statusDiv.style.minHeight = '20px';
        
        const toggleButton = document.createElement('div');
        toggleButton.textContent = '−';
        toggleButton.style.position = 'absolute';
        toggleButton.style.top = '5px';
        toggleButton.style.right = '10px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.fontSize = '16px';
        toggleButton.style.lineHeight = '16px';
        toggleButton.style.width = '16px';
        toggleButton.style.textAlign = 'center';
        
        const contentDiv = document.createElement('div');
        contentDiv.id = 'comments-grabber-content';
        
        inputWrapper.appendChild(input);
        inputWrapper.appendChild(button);
        
        contentDiv.appendChild(inputWrapper);
        contentDiv.appendChild(statusDiv);
        
        panel.appendChild(title);
        panel.appendChild(toggleButton);
        panel.appendChild(contentDiv);
        
        document.body.appendChild(panel);
        
        // 添加点击事件
        button.addEventListener('click', function() {
            const code = input.value.trim();
            if (code) {
                updateStatus('正在处理...');
                startGrabbing(code);
            } else {
                updateStatus('请输入关键词');
            }
        });
        
        // 添加折叠/展开功能
        toggleButton.addEventListener('click', function() {
            const content = document.getElementById('comments-grabber-content');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                toggleButton.textContent = '−';
            } else {
                content.style.display = 'none';
                toggleButton.textContent = '+';
            }
        });
        
        // 添加拖动功能
        makeDraggable(panel, title);
        
        return { panel, input, button, statusDiv };
    }
    
    // 使元素可拖动
    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        handle.style.cursor = 'move';
        handle.onmousedown = dragMouseDown;
        
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // 获取鼠标位置
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // 鼠标移动时调用函数
            document.onmousemove = elementDrag;
        }
        
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // 计算新位置
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // 设置元素的新位置
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            element.style.right = 'auto';
        }
        
        function closeDragElement() {
            // 停止移动
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
    
    // 更新状态信息
    function updateStatus(text) {
        const statusDiv = document.getElementById('comments-grabber-status');
        if (statusDiv) {
            statusDiv.textContent = text;
            console.log(text);
        }
    }
    
    // 开始采集流程
    async function startGrabbing(code) {
        // 检查代码格式
        const match = code.match(/^([a-zA-Z0-9-]+)$/);
        if (!match) {
            updateStatus('无效的关键词格式');
            return;
        }
        
        const normalizedCode = code.toLowerCase();
        
        // 检查缓存
        const cachedData = checkCache(normalizedCode);
        if (cachedData) {
            updateStatus('从缓存加载评论...');
            const commentText = formatComments(cachedData.comments);
            GM_setClipboard(commentText);
            GM_notification({
                title: '评论加载结果',
                text: `已从缓存加载 ${cachedData.comments.length} 条评论并复制到剪贴板`,
                timeout: 5000
            });
            updateStatus(`完成！从缓存加载 ${cachedData.comments.length} 条评论`);
            return;
        }
    
        // 在Jable网站上获取评论
        await grabComments(normalizedCode, SITE_CONFIGS['jable.tv']);
    }
    
    // 检查缓存
    function checkCache(code) {
        try {
            const cacheKey = `comments_${code}`;
            const cached = GM_getValue(cacheKey, null);
            console.log('检查缓存:', cacheKey, cached ? '找到缓存' : '无缓存');
            if (!cached) return null;
    
            try {
                const data = JSON.parse(cached);
                if (!data || !data.comments || !Array.isArray(data.comments) || !data.timestamp) {
                    console.error('缓存数据格式无效');
                    GM_deleteValue(cacheKey);
                    return null;
                }
                
                const now = new Date().getTime();
                const CACHE_EXPIRY_DAYS = 30; // 缓存过期天数，可以调整
                
                // 检查是否过期
                if (now - data.timestamp > CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
                    console.log(`缓存已过期 (${CACHE_EXPIRY_DAYS}天)`);
                    GM_deleteValue(cacheKey);
                    return null;
                }
                
                return data;
            } catch (parseError) {
                console.error('缓存数据解析错误:', parseError);
                GM_deleteValue(cacheKey);
                return null;
            }
        } catch (e) {
            console.error('缓存读取错误:', e);
            return null;
        }
    }
    
    // 保存到缓存
    function saveToCache(code, comments) {
        if (!code || !comments || !Array.isArray(comments) || comments.length === 0) {
            console.error('无效的缓存数据');
            return false;
        }
        
        try {
            const cacheKey = `comments_${code}`;
            const data = {
                comments: comments,
                timestamp: new Date().getTime()
            };
            GM_setValue(cacheKey, JSON.stringify(data));
            console.log(`已保存 ${comments.length} 条评论到缓存: ${cacheKey}`);
            return true;
        } catch (e) {
            console.error('缓存保存错误:', e);
            return false;
        }
    }

    // 从HTML文档中提取评论
    function extractCommentsFromDoc(doc, siteConfig) {
        const comments = [];
        
        // 记录HTML结构以便调试
        // console.log('HTML结构:', doc.body ? doc.body.innerHTML.substring(0, 1000) : '无body元素');
        
        // 调试：输出评论容器的存在情况
        const commentsContainer = doc.querySelector('#video_comments_video_comments_items');
        console.log('评论容器存在:', commentsContainer !== null);
        if (commentsContainer) {
            console.log('评论容器内容长度:', commentsContainer.innerHTML.length);
            console.log('评论容器内容片段:', commentsContainer.innerHTML.substring(0, 300));
        }
                
        const commentElements = doc.querySelectorAll(siteConfig.commentSelector);
        console.log(`找到评论元素: ${commentElements.length}个, 选择器: ${siteConfig.commentSelector}`);
        
        // 检查选择器是否匹配
        console.log('检查其他可能的选择器:');
        console.log('- #video_comments_video_comments_items .item:', doc.querySelectorAll('#video_comments_video_comments_items .item').length);
        console.log('- .comment-list .comment-item:', doc.querySelectorAll('.comment-list .comment-item').length);
        console.log('- .comment-item:', doc.querySelectorAll('.comment-item').length);
        console.log('- .item:', doc.querySelectorAll('.item').length);
        
        commentElements.forEach((comment, index) => {
            // 获取作者名 - 从a标签的title属性获取
            const authorEl = comment.querySelector(siteConfig.authorSelector);
            const author = authorEl ? authorEl.getAttribute('title') : '匿名';
            
            // 获取作者主页链接
            const authorLinkEl = comment.querySelector(siteConfig.authorLinkSelector);
            const authorLink = authorLinkEl ? authorLinkEl.href : '';
            
            // 获取日期 - 从span.inactive-color获取
            const dateEl = comment.querySelector(siteConfig.dateSelector);
            const date = dateEl ? cleanDateString(dateEl.textContent) : '';
            
            // 获取评论内容 - 从p.comment-text span.original-text获取
            const contentEl = comment.querySelector(siteConfig.contentSelector);
            const content = contentEl ? contentEl.textContent.trim() : '';
            
            console.log(`评论 #${index+1}:`, { author, authorLink, date, content: content.substring(0, 50) + (content.length > 50 ? '...' : '') });
            
            // 跳过内容为"此留言尚待審核。"的评论，并过滤不良内容
            if (content && content !== "此留言尚待審核。") {
                // 使用过滤函数检查评论内容
                const filteredContent = filterInappropriateComments(content);
                
                // 如果过滤后内容不为空，则添加到评论列表
                if (filteredContent) {
                    // 解析评论中的时间标签
                    const tags = convertCommentsToTimes(filteredContent);
                    
                    comments.push({
                        author,
                        authorLink,
                        date,
                        msg: filteredContent,
                        tags: tags // 添加解析出的标签列表
                    });
                } else {
                    console.log(`忽略不良内容评论 #${index+1}`);
                }
            } else {
                console.log(`忽略待审核评论 #${index+1}`);
            }
        });
        
        console.log(`从当前页面提取到${comments.length}条评论`);
        return comments;
    }
    
    // 使用GM_xmlhttpRequest发送请求
    function makeRequest(url, retryCount = 0) {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 2000;
        
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: 3000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                    'Referer': url.split('?')[0],
                    'X-Requested-With': 'XMLHttpRequest'
                },
                onload: function(response) {
                    console.log(`请求成功: ${url}`);
                    resolve(response);
                },
                onerror: function(error) {
                    console.error(`请求错误: ${url}`, error);
                    if (retryCount < MAX_RETRIES) {
                        console.log(`第${retryCount + 1}次重试请求: ${url}`);
                        setTimeout(() => {
                            makeRequest(url, retryCount + 1)
                                .then(resolve)
                                .catch(reject);
                        }, RETRY_DELAY);
                    } else {
                        reject(error);
                    }
                },
                ontimeout: function() {
                    console.error(`请求超时: ${url}`);
                    if (retryCount < MAX_RETRIES) {
                        console.log(`第${retryCount + 1}次重试请求: ${url}`);
                        setTimeout(() => {
                            makeRequest(url, retryCount + 1)
                                .then(resolve)
                                .catch(reject);
                        }, RETRY_DELAY);
                    } else {
                        reject(new Error('请求超时'));
                    }
                }
            });
        });
    }

    // 获取随机延迟时间
    function getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 通过API获取评论
    async function grabComments(code, siteConfig) {
        try {
            const baseUrl = siteConfig.urlPattern.replace('{code}', code);
            let allComments = [];
            const parser = new DOMParser();
            updateStatus(`开始获取评论...`);

            // 1. 获取第一页
            const timestamp = Date.now();
            const firstPageUrl = `${baseUrl}?mode=async&function=get_block&block_id=video_comments_video_comments&sort_by=&from=1&ipp=${siteConfig.commentsPerPage}&_=${timestamp}`;
            updateStatus(`获取第1页评论...`);
            console.log(`请求第1页URL: ${firstPageUrl}`);
            const firstResponse = await makeRequest(firstPageUrl);
            if (!firstResponse || firstResponse.status !== 200) {
                updateStatus(`无法获取评论，视频可能不存在`);
                console.error(`第1页请求失败，状态码: ${firstResponse?.status}`);
                return;
            }

            // 解析第一页HTML
            const firstDoc = parser.parseFromString(firstResponse.responseText, 'text/html');
            const firstPageComments = extractCommentsFromDoc(firstDoc, siteConfig);
            console.log(`第1页解析到评论数: ${firstPageComments.length}`);
            allComments = allComments.concat(firstPageComments);

            // 2. 解析总评论数
            function getTotalComments(doc) {
                const h6 = doc.querySelector('h6.sub-title');
                if (!h6) {
                    console.error('未找到评论标题元素 h6.sub-title');
                    return null;
                }
                console.log(`评论标题文本: "${h6.textContent}"`);
                const match = h6.textContent.match(/留言\s*\((\d+)\)/);
                console.log(`评论数量匹配结果: ${JSON.stringify(match)}`);
                return match ? parseInt(match[1], 10) : null;
            }
            const totalComments = getTotalComments(firstDoc);
            if (!totalComments) {
                updateStatus(`未找到评论`);
                console.error('无法解析总评论数');
                return;
            }
            const commentsPerPage = siteConfig.commentsPerPage;
            const totalPages = Math.ceil(totalComments / commentsPerPage);
            console.log(`解析到总评论数: ${totalComments}, 每页评论数: ${commentsPerPage}, 总页数: ${totalPages}`);
            updateStatus(`共${totalComments}条评论，${totalPages}页，开始并行采集...`);

            // 3. 并行请求剩余页面
            const requests = [];
            for (let pageIndex = 2; pageIndex <= totalPages; pageIndex++) {
                const url = `${baseUrl}?mode=async&function=get_block&block_id=video_comments_video_comments&sort_by=&from=${pageIndex}&ipp=${commentsPerPage}&_=${Date.now()}`;
                console.log(`添加第${pageIndex}页请求: ${url}`);
                requests.push(makeRequest(url));
            }
            let responses = [];
            if (requests.length > 0) {
                console.log(`开始并行请求${requests.length}个页面`);
                responses = await Promise.all(requests);
                console.log(`收到${responses.length}个响应`);
            }
            for (const [i, res] of responses.entries()) {
                if (res && res.status === 200) {
                    console.log(`第${i+2}页响应长度: ${res.responseText.length}`);
                    const doc = parser.parseFromString(res.responseText, 'text/html');
                    const pageComments = extractCommentsFromDoc(doc, siteConfig);
                    console.log(`第${i+2}页解析到评论数: ${pageComments.length}`);
                    allComments = allComments.concat(pageComments);
                    updateStatus(`已获取第${i+2}页评论: ${pageComments.length}条，累计: ${allComments.length}条`);
                } else {
                    console.error(`第${i+2}页请求失败，状态码: ${res?.status}`);
                    updateStatus(`第${i+2}页评论获取失败`);
                }
            }

            console.log(`最终采集到的评论总数: ${allComments.length}, 网站显示的评论总数: ${totalComments}`);
            if (allComments.length === 0) {
                updateStatus(`未找到评论`);
                return;
            }

            // 保存到缓存
            if (allComments.length > 0) {
                saveToCache(code, allComments);
            }

            // 格式化并复制评论
            const commentText = formatComments(allComments);
            GM_setClipboard(commentText);

            // 显示通知
            GM_notification({
                title: '评论采集结果',
                text: `已采集 ${allComments.length}/${totalComments} 条评论并复制到剪贴板`,
                timeout: 5000
            });

            updateStatus(`完成！共采集 ${allComments.length}/${totalComments} 条评论`);
        } catch (error) {
            updateStatus(`错误: ${error.message}`);
            console.error('采集过程发生错误:', error);
        }
    }
    
    // 清理日期字符串，提取时间相关部分
    function cleanDateString(dateStr) {
        // 直接返回原始日期文本，不做复杂处理
        return dateStr ? dateStr.trim() : '';
    }
    
    // 从页面提取评论
    function extractComments(html, siteConfig) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const comments = [];
        
        const commentElements = doc.querySelectorAll(siteConfig.commentSelector);
        
        commentElements.forEach(commentEl => {
            const authorEl = commentEl.querySelector(siteConfig.authorSelector);
            const dateEl = commentEl.querySelector(siteConfig.dateSelector);
            const contentEl = commentEl.querySelector(siteConfig.contentSelector);
            
            // 获取作者主页链接
            const authorLinkEl = commentEl.querySelector(siteConfig.authorLinkSelector);
            const authorLink = authorLinkEl ? authorLinkEl.href : '';
            
            if (authorEl && contentEl) {
                comments.push({
                    author: authorEl.textContent.trim(),
                    authorLink: authorLink, // 添加作者主页链接
                    date: dateEl ? cleanDateString(dateEl.textContent) : '',
                    content: contentEl.textContent.trim()
                });
            }
        });
        
        return comments;
    }
    
    // 格式化评论为JSON
    function formatComments(comments) {
        if (!comments || comments.length === 0) {
            return '[]';
        }
        
        // 将评论数组转换为JSON字符串
        return JSON.stringify(comments, null, 2);
    }
    
    // 应用快捷键
    function setupShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Alt+C 显示/隐藏面板
            if (e.altKey && e.key === 'c') {
                const panel = document.getElementById('comments-grabber-panel');
                if (panel) {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                } else {
                    createControlPanel();
                }
            }
        });
    }
    
    // 页面加载完成后执行
    window.addEventListener('load', function() {
        createControlPanel();
        setupShortcuts();
        
        // 检查URL是否含有特定参数，如果有则自动开始采集
        const url = new URL(window.location.href);
        const grabCode = url.searchParams.get('grab-comments');
        if (grabCode) {
            const input = document.getElementById('comments-grabber-input');
            if (input) {
                input.value = grabCode;
                document.getElementById('comments-grabber-button').click();
            }
        }
    });
})();
