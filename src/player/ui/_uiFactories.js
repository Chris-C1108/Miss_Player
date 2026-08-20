import { LAYOUT_LEFT, LAYOUT_RIGHT, COMMENTS_SHOW, COMMENTS_HIDE } from '../../constants/icons.js';

/**
 * _uiFactories.js — UIManager 的纯 DOM 构建工厂函数集合
 */

/**
 * 创建遮罩层元素
 * @returns {HTMLDivElement}
 */
export function createOverlayElement() {
    const overlay = document.createElement('div');
    overlay.className = 'tm-video-overlay';
    overlay.style.zIndex = '2000000000';
    return overlay;
}

/**
 * 创建视频容器元素
 * @param {number} defaultHeight 默认高度
 * @param {number} defaultMinHeight 默认最小高度
 * @returns {HTMLDivElement}
 */
export function createContainerElement(defaultHeight, defaultMinHeight) {
    const container = document.createElement('div');
    container.className = 'tm-video-container';
    container.style.height = `${defaultHeight}px`;
    container.style.minHeight = `${defaultMinHeight}px`;
    return container;
}

/**
 * 创建播放器主容器元素
 * @param {boolean} isSidebarHidden
 * @param {string} sidebarPosition
 * @returns {HTMLDivElement}
 */
export function createPlayerContainerElement(isSidebarHidden, sidebarPosition) {
    const playerContainer = document.createElement('div');
    playerContainer.className = 'tm-player-container';
    playerContainer.style.zIndex = '2000000001';

    if (isSidebarHidden) {
        playerContainer.classList.add('tm-sidebar-hidden');
    }
    if (sidebarPosition === 'left') {
        playerContainer.classList.add('tm-sidebar-left');
    }
    return playerContainer;
}

/**
 * 创建拖动调整手柄
 * @returns {{handleContainer: HTMLDivElement, handle: HTMLDivElement}}
 */
export function createResizeHandleElement() {
    const handleContainer = document.createElement('div');
    handleContainer.className = 'tm-handle-container';

    const handle = document.createElement('div');
    handle.className = 'tm-resize-handle';

    handle.insertAdjacentHTML('beforeend', `
        <div style="
            position: absolute;
            left: -10px;
            right: -10px;
            top: -15px;
            bottom: -15px;
            background: transparent;
        "></div>
    `);

    handleContainer.appendChild(handle);
    return { handleContainer, handle };
}

/**
 * 创建关闭按钮
 * @returns {HTMLButtonElement}
 */
export function createCloseButtonElement() {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'tm-close-button tm-control-button-base';

    const closeIcon = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    closeBtn.innerHTML = closeIcon;

    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.backgroundColor = 'hsla(var(--shadcn-destructive) / 0.9)';
        closeBtn.style.transform = 'scale(1.1)';
    });

    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.backgroundColor = 'hsla(var(--shadcn-background) / 0.7)';
        closeBtn.style.transform = 'scale(1)';
    });

    return closeBtn;
}

/**
 * 创建设置按钮
 * @returns {HTMLButtonElement}
 */
export function createSettingsButtonElement() {
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'tm-settings-button tm-control-button-base';

    const settingsIcon = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1837 17.2737 20.4009 17.7994 20.4009 18.345C20.4009 18.8906 20.1837 19.4163 19.79 19.81C19.4163 20.2037 18.8906 20.4209 18.345 20.4209C17.7994 20.4209 17.2737 20.2037 16.91 19.81L16.85 19.75C16.3678 19.2783 15.6471 19.1477 15.03 19.42C14.4301 19.6801 14.0386 20.2502 14.03 20.89V21C14.03 21.5304 13.8193 22.0391 13.4442 22.4142C13.0691 22.7893 12.5604 23 12.03 23C11.4996 23 10.9909 22.7893 10.6158 22.4142C10.2407 22.0391 10.03 21.5304 10.03 21V20.91C10.0112 20.2556 9.5979 19.6818 8.98 19.43C8.36289 19.1577 7.64221 19.2883 7.16 19.76L7.1 19.82C6.73629 20.2137 6.21056 20.4309 5.665 20.4309C5.11944 20.4309 4.59371 20.2137 4.23 19.82C3.83628 19.4463 3.61911 18.9206 3.61911 18.375C3.61911 17.8294 3.83628 17.3037 4.23 16.93L4.29 16.87C4.76167 16.3878 4.89231 15.6671 4.62 15.05C4.35995 14.4501 3.78985 14.0586 3.15 14.05H3C2.46957 14.05 1.96086 13.8393 1.58579 13.4642C1.21071 13.0891 1 12.5804 1 12.05C1 11.5196 1.21071 11.0109 1.58579 10.6358C1.96086 10.2607 2.46957 10.05 3 10.05H3.09C3.74435 10.0312 4.31814 9.61788 4.57 9C4.84231 8.38289 4.71167 7.66221 4.24 7.18L4.18 7.12C3.78628 6.75629 3.56911 6.23056 3.56911 5.685C3.56911 5.13944 3.78628 4.61371 4.18 4.25C4.55371 3.85628 5.07944 3.63911 5.625 3.63911C6.17056 3.63911 6.69629 3.85628 7.07 4.25L7.13 4.31C7.61221 4.78167 8.33289 4.91231 8.95 4.64H9C9.59994 4.37995 9.99144 3.80985 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0086 3.72985 14.4001 4.29995 15 4.56C15.6171 4.83231 16.3378 4.70167 16.82 4.23L16.88 4.17C17.2437 3.77628 17.7694 3.55911 18.325 3.55911C18.8806 3.55911 19.4063 3.77628 19.77 4.17C20.1637 4.54371 20.3809 5.06944 20.3809 5.615C20.3809 6.16056 20.1637 6.68629 19.77 7.06L19.71 7.12C19.2383 7.60221 19.1077 8.32289 19.38 8.94L19.4 9C19.66 9.59994 20.2301 9.99144 20.87 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.2702 14.0086 19.7001 14.4001 19.44 15H19.4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    settingsBtn.innerHTML = settingsIcon;

    settingsBtn.addEventListener('mouseenter', () => {
        settingsBtn.style.backgroundColor = 'hsla(var(--shadcn-accent) / 0.9)';
        settingsBtn.style.transform = 'rotate(45deg)';
    });

    settingsBtn.addEventListener('mouseleave', () => {
        settingsBtn.style.backgroundColor = 'hsla(var(--shadcn-background) / 0.7)';
        settingsBtn.style.transform = 'rotate(0deg)';
    });

    return settingsBtn;
}

/**
 * 创建侧栏控制按钮 (位置与显隐)
 * @param {string} sidebarPosition
 * @param {boolean} isSidebarHidden
 * @returns {{sidebarPosBtn: HTMLButtonElement, sidebarToggleBtn: HTMLButtonElement}}
 */
export function createSidebarControlButtons(sidebarPosition, isSidebarHidden) {
    const sidebarPosBtn = document.createElement('button');
    sidebarPosBtn.className = 'tm-sidebar-pos-button tm-control-button-base';
    sidebarPosBtn.style.display = 'flex';
    sidebarPosBtn.innerHTML = sidebarPosition === 'right' ? LAYOUT_LEFT : LAYOUT_RIGHT;
    sidebarPosBtn.title = sidebarPosition === 'right' ? '切换侧边栏到左侧' : '切换侧边栏到右侧';

    const sidebarToggleBtn = document.createElement('button');
    sidebarToggleBtn.className = 'tm-sidebar-toggle-button tm-control-button-base';
    sidebarToggleBtn.style.display = 'flex';
    sidebarToggleBtn.innerHTML = isSidebarHidden ? COMMENTS_SHOW : COMMENTS_HIDE;
    sidebarToggleBtn.title = isSidebarHidden ? '显示评论区' : '隐藏评论区';

    return { sidebarPosBtn, sidebarToggleBtn };
}

/**
 * 创建按钮容器
 * @returns {HTMLDivElement}
 */
export function createButtonContainerElement() {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'tm-button-container';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.zIndex = '99999';
    return buttonContainer;
}

/**
 * 创建设置面板元素
 * @returns {HTMLDivElement}
 */
export function createSettingsPanelElement() {
    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'tm-settings-panel';
    return settingsPanel;
}

/**
 * 创建长按倍速视觉提示
 * @param {string} [text='3x']
 * @returns {HTMLDivElement}
 */
export function createSpeedIndicatorElement(text = '3x') {
    const speedIndicator = document.createElement('div');
    speedIndicator.className = 'tm-speed-indicator';
    speedIndicator.textContent = text;
    speedIndicator.style.position = 'absolute';
    speedIndicator.style.top = '50%';
    speedIndicator.style.left = '50%';
    speedIndicator.style.transform = 'translate(-50%, -50%)';
    speedIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    speedIndicator.style.color = 'white';
    speedIndicator.style.padding = '8px 16px';
    speedIndicator.style.borderRadius = '4px';
    speedIndicator.style.fontSize = '24px';
    speedIndicator.style.fontWeight = 'bold';
    speedIndicator.style.zIndex = '9999';
    return speedIndicator;
}

/**
 * 获取视频标题
 * @returns {string}
 */
export function getVideoTitle() {
    const h4 = document.querySelector('h4');
    if (h4 && h4.textContent) {
        return h4.textContent.trim();
    }
    
    const h1 = document.querySelector('h1');
    if (h1 && h1.textContent) {
        return h1.textContent.trim();
    }
    
    let title = document.title || '';
    title = title.replace(/\s*-\s*Jable\.tv.*$/i, '');
    title = title.replace(/\s*-\s*JAVLibrary.*$/i, '');
    return title.trim();
}
