
/**
 * 系统化多维语义标签体系 (Semantic Tag Taxonomy)
 * 包含体位姿势、相貌身材、行为特征、服装道具、激烈程度、主观剧情等多维分类
 */

export const SEMANTIC_TAG_TAXONOMY = [
    {
        category: '体位姿势',
        tags: ['#仰面深喉', '#双管齐下', '#后背突入', '#骑乘上位', '#侧卧漫插', '#站立悬空', '#面对面抱坐', '#火车便当']
    },
    {
        category: '相貌身材',
        tags: ['#极品颜值', '#傲人丰胸', '#纤细蜂腰', '#白皙美腿', '#肉感微胖', '#苗条白虎', '#童颜巨乳']
    },
    {
        category: '行为特征',
        tags: ['#极致前戏', '#深喉干呕', '#绝顶抽搐', '#潮吹失禁', '#深层内射', '#口爆吞精', '#足交漫游', '#乳交夹心']
    },
    {
        category: '服装道具',
        tags: ['#清纯制服', '#性感丝袜', '#情趣死库水', '#拘束调教', '#跳蛋玩具', '#皮衣网袜']
    },
    {
        category: '激烈程度',
        tags: ['#温柔慢调', '#狂暴疾风', '#渐进高潮', '#粗暴打桩', '#窒息深喉']
    },
    {
        category: '主观剧情',
        tags: ['#剧情神回', '#封面欺诈', '#演技逼真', '#全程高能', '#纯爱催泪', '#反差绝顶']
    }
];

export const RANDOM_CAPSULE_COLORS = [
    '200, 100%, 55%', // Sky Blue
    '145, 80%, 48%',  // Emerald Green
    '260, 85%, 62%',  // Purple-Indigo
    '15, 95%, 58%',   // Vibrant Coral
    '330, 90%, 60%',  // Rose Pink
    '170, 85%, 42%',  // Mint/Teal
    '45, 95%, 52%',   // Warm Amber
    '280, 85%, 65%',  // Lavender
    '190, 90%, 45%',  // Cyan
    '350, 85%, 60%'   // Crimson
];

export function getRandomCapsuleColor() {
    return RANDOM_CAPSULE_COLORS[Math.floor(Math.random() * RANDOM_CAPSULE_COLORS.length)];
}
