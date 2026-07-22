/**
 * SVG 图标常量定义集合
 * 用于整个播放器界面及浮动按钮
 */

export const FLOATING_PLAY = `
    <svg width="48" height="48" viewBox="0 0 68 48" fill="none">
        <path class="tm-play-button-bg" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="rgb(254, 98, 142)"></path>
        <path d="M 45,24 27,14 27,34" fill="#fff"></path>
    </svg>
`;

export const PLAY = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 12L7 5V19L18 12Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
`;

export const PAUSE = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 4H6V20H10V4Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M18 4H14V20H18V4Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
`;

export const PLAY_CENTER = `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14,6v20c0,1.1-0.9,2-2,2H8c-1.1,0-2-0.9-2-2V6c0-1.1,0.9-2,2-2h4C13.1,4,14,4.9,14,6z M24,4h-4
        c-1.1,0-2,0.9-2,2v20c0,1.1,0.9,2,2,2h4c1.1,0,2-0.9,2-2V6C26,4.9,25.1,4,24,4z" fill="white"/>
    </svg>
`;

export const MUTE = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M23 9L17 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 9L23 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
`;

export const VOLUME_LOW = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
`;

export const VOLUME_HIGH = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M18.54 5.46C20.4246 7.34535 21.4681 9.90302 21.4681 12.575C21.4681 15.247 20.4246 17.8047 18.54 19.69" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
`;

export const REWIND = `
    <svg width="14" height="14" viewBox="0 0 12 24" fill="none" class="tm-rewind-icon">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.70711 4.29289C3.31658 3.90237 2.68342 3.90237 2.29289 4.29289L-4.70711 11.2929C-5.09763 11.6834 -5.09763 12.3166 -4.70711 12.7071L2.29289 19.7071C2.68342 20.0976 3.31658 20.0976 3.70711 19.7071C4.09763 19.3166 4.09763 18.6834 3.70711 18.2929L-2.58579 12L3.70711 5.70711C4.09763 5.31658 4.09763 4.68342 3.70711 4.29289Z" fill="currentColor"/>
    </svg>
`;

export const FORWARD = `
    <svg width="14" height="14" viewBox="0 0 12 24" fill="none" class="tm-forward-icon">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.29289 4.29289C8.68342 3.90237 9.31658 3.90237 9.70711 4.29289L16.7071 11.2929C17.0976 11.6834 17.0976 12.3166 16.7071 12.7071L9.70711 19.7071C9.31658 20.0976 8.68342 20.0976 8.29289 19.7071C7.90237 19.3166 7.90237 18.6834 8.29289 18.2929L14.5858 12L8.29289 5.70711C7.90237 5.31658 7.90237 4.68342 8.29289 4.29289Z" fill="currentColor"/>
    </svg>
`;

export const CLOSE = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
`;

export const CLOSE_LINE = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
`;

export const SEND = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
`;

export const SETTINGS = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1837 17.2737 20.4009 17.7994 20.4009 18.345C20.4009 18.8906 20.1837 19.4163 19.79 19.81C19.4163 20.2037 18.8906 20.4209 18.345 20.4209C17.7994 20.4209 17.2737 20.2037 16.91 19.81L16.85 19.75C16.3678 19.2783 15.6471 19.1477 15.03 19.42C14.4301 19.6801 14.0386 20.2502 14.03 20.89V21C14.03 21.5304 13.8193 22.0391 13.4442 22.4142C13.0691 22.7893 12.5604 23 12.03 23C11.4996 23 10.9909 22.7893 10.6158 22.4142C10.2407 22.0391 10.03 21.5304 10.03 21V20.91C10.0112 20.2556 9.5979 19.6818 8.98 19.43C8.36289 19.1577 7.64221 19.2883 7.16 19.76L7.1 19.82C6.73629 20.2137 6.21056 20.4309 5.665 20.4309C5.11944 20.4309 4.59371 20.2137 4.23 19.82C3.83628 19.4463 3.61911 18.9206 3.61911 18.375C3.61911 17.8294 3.83628 17.3037 4.23 16.93L4.29 16.87C4.76167 16.3878 4.89231 15.6671 4.62 15.05C4.35995 14.4501 3.78985 14.0586 3.15 14.05H3C2.46957 14.05 1.96086 13.8393 1.58579 13.4642C1.21071 13.0891 1 12.5804 1 12.05C1 11.5196 1.21071 11.0109 1.58579 10.6358C1.96086 10.2607 2.46957 10.05 3 10.05H3.09C3.74435 10.0312 4.31814 9.61788 4.57 9C4.84231 8.38289 4.71167 7.66221 4.24 7.18L4.18 7.12C3.78628 6.75629 3.56911 6.23056 3.56911 5.685C3.56911 5.13944 3.78628 4.61371 4.18 4.25C4.55371 3.85628 5.07944 3.63911 5.625 3.63911C6.17056 3.63911 6.69629 3.85628 7.07 4.25L7.13 4.31C7.61221 4.78167 8.33289 4.91231 8.95 4.64H9C9.59994 4.37995 9.99144 3.80985 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0086 3.72985 14.4001 4.29995 15 4.56C15.6171 4.83231 16.3378 4.70167 16.82 4.23L16.88 4.17C17.2437 3.77628 17.7694 3.55911 18.325 3.55911C18.8806 3.55911 19.4063 3.77628 19.77 4.17C20.1637 4.54371 20.3809 5.06944 20.3809 5.615C20.3809 6.16056 20.1637 6.68629 19.77 7.06L19.71 7.12C19.2383 7.60221 19.1077 8.32289 19.38 8.94L19.4 9C19.66 9.59994 20.2301 9.99144 20.87 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.2702 14.0086 19.7001 14.4001 19.44 15H19.4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
`;

export const LOOP_INDICATOR = `
    <svg width="12" height="12" style="vertical-align: middle;">
        <circle class="tm-loop-indicator-circle" cx="6" cy="6" r="5" fill="hsl(var(--shadcn-muted-foreground) / 0.5)"></circle>
    </svg>
`;

export const KEYBOARD = `
    <svg viewBox="2 5 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8 5H16C18.8284 5 20.2426 5 21.1213 5.87868C22 6.75736 22 8.17157 22 11V13C22 15.8284 22 17.2426 21.1213 18.1213C20.2426 19 18.8284 19 16 19H8C5.17157 19 3.75736 19 2.87868 18.1213C2 17.2426 2 15.8284 2 13V11C2 8.17157 2 6.75736 2.87868 5.87868C3.75736 5 5.17157 5 8 5ZM6 10C6.55228 10 7 9.55228 7 9C7 8.44772 6.55228 8 6 8C5.44772 8 5 8.44772 5 9C5 9.55228 5.44772 10 6 10ZM6 13C6.55228 13 7 12.5523 7 12C7 11.4477 6.55228 11 6 11C5.44772 11 5 11.4477 5 12C5 12.5523 5.44772 13 6 13ZM9 13C9.55228 13 10 12.5523 10 12C10 11.4477 9.55228 11 9 11C8.44772 11 8 11.4477 8 12C8 12.5523 8.44772 13 9 13ZM9 10C9.55228 10 10 9.55228 10 9C10 8.44772 9.55228 8 9 8C8.44772 8 8 8.44772 8 9C8 9.55228 8.44772 10 9 10ZM12 10C12.5523 10 13 9.55228 13 9C13 8.44772 12.5523 8 12 8C11.4477 8 11 8.44772 11 9C11 9.55228 11.4477 10 12 10ZM12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13ZM15 10C15.5523 10 16 9.55228 16 9C16 8.44772 15.5523 8 15 8C14.4477 8 14 8.44772 14 9C14 9.55228 14.4477 10 15 10ZM15 13C15.5523 13 16 12.5523 16 12C16 11.4477 15.5523 11 15 11C14.4477 11 14 11.4477 14 12C14 12.5523 14.4477 13 15 13ZM18 10C18.5523 10 19 9.55228 19 9C19 8.44772 18.5523 8 18 8C17.4477 8 17 8.44772 17 9C17 9.55228 17.4477 10 18 10ZM18 13C18.5523 13 19 12.5523 19 12C19 11.4477 18.5523 11 18 11C17.4477 11 17 11.4477 17 12C17 12.5523 17.4477 13 18 13ZM17.75 16C17.75 16.4142 17.4142 16.75 17 16.75H7C6.58579 16.75 6.25 16.4142 6.25 16C6.25 15.5858 6.58579 15.25 7 15.25H17C17.4142 15.25 17.75 15.5858 17.75 16Z" fill="currentColor"/>
    </svg>
`;

export const LAYOUT_LEFT = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5"/>
        <line x1="7.5" y1="3" x2="7.5" y2="21"/>
        <path d="M15.5 9l-3 3 3 3"/>
    </svg>
`;

export const LAYOUT_RIGHT = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5"/>
        <line x1="16.5" y1="3" x2="16.5" y2="21"/>
        <path d="M8.5 9l3 3-3 3"/>
    </svg>
`;

export const COMMENTS_SHOW = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
`;

export const COMMENTS_HIDE = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" opacity="0.4"/>
        <line x1="3" y1="3" x2="21" y2="21"/>
    </svg>
`;

