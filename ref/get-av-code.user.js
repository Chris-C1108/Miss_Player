// ==UserScript==
// @name         AV番号提取器
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  从missav.ws和jable.tv网站解析当前页面的AV番号
// @author       MissPlayer
// @match        *://*.missav.ws/*
// @match        *://*.jable.tv/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    // 配置
    const config = {
        missav: {
            titleSelector: '.container h1',
            urlPattern: /https?:\/\/(?:www\.)?missav\.ws\/([a-zA-Z0-9\-]+)/
        },
        jable: {
            titleSelector: '.header-left h4',
            urlPattern: /https?:\/\/(?:www\.)?jable\.tv\/videos\/([a-zA-Z0-9\-]+)/
        },
        // 通用AV番号正则表达式
        avCodePattern: /([a-zA-Z]+)[-\s]?(\d+)/i
    };
    
    // 主函数
    function main() {
        let avCode = extractAvCode();
        if (avCode) {
            showAvCode(avCode);
        }
    }
    
    // 从页面提取AV番号
    function extractAvCode() {
        let avCode = null;
        
        // 判断当前网站
        const currentDomain = window.location.hostname;
        
        if (currentDomain.includes('missav.ws')) {
            avCode = extractFromMissAV();
        } else if (currentDomain.includes('jable.tv')) {
            avCode = extractFromJable();
        }
        
        return avCode;
    }
    
    // 从MissAV提取AV番号
    function extractFromMissAV() {
        // 方法1: 从URL中提取
        const urlMatch = window.location.href.match(config.missav.urlPattern);
        if (urlMatch && urlMatch[1]) {
            const codeFromUrl = urlMatch[1].toUpperCase();
            const formatted = formatAvCode(codeFromUrl);
            if (formatted) return formatted;
        }
        
        // 方法2: 从标题提取
        const titleElement = document.querySelector(config.missav.titleSelector);
        if (titleElement) {
            const titleText = titleElement.textContent.trim();
            const match = titleText.match(config.avCodePattern);
            if (match) {
                return `${match[1]}-${match[2]}`;
            }
        }
        
        return null;
    }
    
    // 从Jable提取AV番号
    function extractFromJable() {
        // 方法1: 从URL中提取
        const urlMatch = window.location.href.match(config.jable.urlPattern);
        if (urlMatch && urlMatch[1]) {
            const codeFromUrl = urlMatch[1].toUpperCase();
            const formatted = formatAvCode(codeFromUrl);
            if (formatted) return formatted;
        }
        
        // 方法2: 从标题提取
        const titleElement = document.querySelector(config.jable.titleSelector);
        if (titleElement) {
            const titleText = titleElement.textContent.trim();
            const match = titleText.match(config.avCodePattern);
            if (match) {
                return `${match[1]}-${match[2]}`;
            }
        }
        
        return null;
    }
    
    // 格式化AV番号
    function formatAvCode(code) {
        const match = code.match(config.avCodePattern);
        if (match) {
            return `${match[1]}-${match[2]}`;
        }
        return code;
    }
    
    // 在页面上显示AV番号
    function showAvCode(avCode) {
        // 创建显示元素
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 16px;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        `;
        
        // 添加复制按钮和文本
        const codeText = document.createElement('span');
        codeText.textContent = `番号: ${avCode}`;
        codeText.style.marginRight = '10px';
        
        const copyButton = document.createElement('button');
        copyButton.textContent = '复制';
        copyButton.style.cssText = `
            background-color: #007aff;
            border: none;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;
        
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(avCode).then(() => {
                copyButton.textContent = '已复制';
                setTimeout(() => {
                    copyButton.textContent = '复制';
                }, 2000);
            });
        });
        
        // 添加关闭按钮
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: #ccc;
            font-size: 18px;
            cursor: pointer;
            margin-left: 10px;
            padding: 0 5px;
        `;
        
        closeButton.addEventListener('click', () => {
            document.body.removeChild(container);
        });
        
        container.appendChild(codeText);
        container.appendChild(copyButton);
        container.appendChild(closeButton);
        document.body.appendChild(container);
    }
    
    // 启动脚本
    main();
})();
