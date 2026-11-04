/**
 * STRM 虚拟视频流生成与入库流水线 (StrmIngestPipeline)
 * 
 * 职责：
 * 1. 嗅探提取当前视频的实时 m3u8 / MP4 播放流
 * 2. 构造符合 Peach 官方规范的标准化 [AVCODE].strm 文件 (首行纯流地址 + 规范元数据注释)
 * 3. 驱动 WebDAV 客户端将 .strm 原子写入用户 NAS / 网盘中 Peach 的媒体根目录
 * 4. 平民降级：未配置 WebDAV 时，支持浏览器直接生成 Blob 并下载 .strm
 * 5. 入库完成后自动通知 PeachService 发起 /api/resource-sync/scan 目录刮削对账
 */

import { mediaSniffer } from '../network/MediaSniffer.js';
import { SyncManager } from '../sync/index.js';
import { WebDavClient } from '../sync/WebDavClient.js';
import { PeachService } from './PeachService.js';
import { cleanAvCode } from '../utils/videoCode.js';

export class StrmIngestPipeline {
    /**
     * 嗅探或提取当前正在播放的有效流地址
     * @param {HTMLVideoElement} [videoEl] - 可选宿主 video 节点
     * @returns {string} 视频流直链 URL
     */
    static resolveStreamUrl(videoEl = null) {
        // 1. 优先从底层 MediaSniffer 获取最新捕获的高清/HLS 流
        const sniffedHls = mediaSniffer.getLatestStream('hls');
        if (sniffedHls && sniffedHls.url) {
            return sniffedHls.url;
        }

        const latestSniffed = mediaSniffer.getLatestStream();
        if (latestSniffed && latestSniffed.url) {
            return latestSniffed.url;
        }

        // 2. 从传入的或页面上的 video 节点探测
        const video = videoEl || document.querySelector('miss-player-root')?.shadowRoot?.querySelector('video') || document.querySelector('video');
        if (video) {
            if (video.currentSrc && typeof video.currentSrc === 'string' && !video.currentSrc.startsWith('blob:')) {
                return video.currentSrc;
            }
            if (video.src && typeof video.src === 'string' && !video.src.startsWith('blob:')) {
                return video.src;
            }
            const source = video.querySelector('source[src]');
            if (source && source.src && !source.src.startsWith('blob:')) {
                return source.src;
            }
        }

        // 3. 兜底尝试从全部嗅探列表中获取任何非 blob 的媒体地址
        const allStreams = mediaSniffer.getAllStreams();
        if (allStreams.length > 0) {
            const valid = allStreams.reverse().find(s => s.url && !s.url.startsWith('blob:'));
            if (valid) return valid.url;
        }

        return '';
    }

    /**
     * 构造符合 Peach 官方规范的 .strm 纯文本内容
     * 规范：首行有且仅有一行有效 HTTP(S) 地址，注释行以 # 开头
     * @param {string} streamUrl - 流地址
     * @param {string} avcode - 番号
     * @param {Object} [meta] - 附加元数据
     * @returns {string}
     */
    static generateStrmContent(streamUrl, avcode, meta = {}) {
        const cleanUrl = String(streamUrl || '').trim();
        const code = cleanAvCode(avcode) || avcode || 'UNKNOWN';
        const sourcePage = meta.sourcePage || window.location.href;
        const pageTitle = meta.title || document.title || '';
        const nowIso = new Date().toISOString();

        return [
            cleanUrl,
            `# avcode: ${code}`,
            `# source: ${sourcePage}`,
            `# title: ${pageTitle.replace(/[\r\n]/g, ' ').slice(0, 120)}`,
            `# generator: Miss Player WebDAV Ingest Pipeline`,
            `# created_at: ${nowIso}`
        ].join('\n') + '\n';
    }

    /**
     * 执行入库流水线（全自动捕获流 ➔ 生成 .strm ➔ 落盘 ➔ 触发对账）
     * @param {Object} options
     * @param {string} options.avcode - 目标番号
     * @param {HTMLVideoElement} [options.videoEl] - 视频元素
     * @param {string} [options.customStreamUrl] - 自定义指定流地址（可选）
     * @param {boolean} [options.forceDownload=false] - 强制使用浏览器下载
     * @returns {Promise<{ success: boolean, mode: 'webdav'|'download', path: string, message: string }>}
     */
    static async ingest({ avcode, videoEl = null, customStreamUrl = '', forceDownload = false }) {
        if (!avcode) {
            throw new Error('缺失有效影片番号');
        }

        const normalizedCode = cleanAvCode(avcode) || avcode.trim().toUpperCase();
        const streamUrl = customStreamUrl || this.resolveStreamUrl(videoEl);

        if (!streamUrl) {
            throw new Error('未嗅探到有效视频流地址，请等待视频开始缓冲播放后重试');
        }

        const strmContent = this.generateStrmContent(streamUrl, normalizedCode);
        const fileName = `${normalizedCode}.strm`;

        // 检查 WebDAV 配置
        const webDavConfig = SyncManager.getWebDavConfig();
        const hasWebDav = Boolean(webDavConfig && webDavConfig.url && webDavConfig.user);
        const peachConfig = PeachService.getConfig();

        // 优先路径 1：配置了 WebDAV 且未强制下载
        if (hasWebDav && !forceDownload) {
            const targetDir = peachConfig.strmDir || '/Media/STRM/';
            const targetPath = `${targetDir.endsWith('/') ? targetDir : targetDir + '/'}${fileName}`;
            
            try {
                // 利用 WebDavClient 上传文件
                const uploadResult = await WebDavClient.uploadFile(
                    webDavConfig,
                    targetPath,
                    strmContent,
                    'text/plain; charset=utf-8'
                );

                if (uploadResult && uploadResult.success) {
                    // 若配置了 Peach 服务端，触发媒体库扫描对账
                    let scanTriggered = false;
                    if (peachConfig.enabled && peachConfig.base && peachConfig.token) {
                        try {
                            const scanRes = await PeachService.triggerScan();
                            scanTriggered = Boolean(scanRes && scanRes.ok);
                        } catch (scanErr) {
                            console.warn('[StrmIngestPipeline] 触发 Peach 扫描轻量警告:', scanErr.message);
                        }
                    }

                    return {
                        success: true,
                        mode: 'webdav',
                        path: targetPath,
                        scanTriggered,
                        message: scanTriggered ? `已写入 WebDAV 并通知 Peach 自动刮削` : `已写入 WebDAV 目录`
                    };
                }
            } catch (webDavErr) {
                console.warn('[StrmIngestPipeline] WebDAV 写入失败，降级至浏览器下载:', webDavErr.message);
                // 失败时降级走浏览器下载
            }
        }

        // 降级路径 2：浏览器直接下载保存 .strm 文件
        try {
            this.triggerBrowserDownload(fileName, strmContent);
            return {
                success: true,
                mode: 'download',
                path: fileName,
                scanTriggered: false,
                message: `已导出 ${fileName}，请放入 Peach 媒体目录`
            };
        } catch (downloadErr) {
            throw new Error(`生成并导出 .strm 失败: ${downloadErr.message}`);
        }
    }

    /**
     * 触发浏览器原生文件下载
     */
    static triggerBrowserDownload(fileName, content) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        setTimeout(() => {
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
        }, 1000);
    }
}
