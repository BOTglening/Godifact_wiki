/**
 * 神造物 Wiki 层级注册表
 *
 * 整套 wiki 的"表 / 中 / 底"三层分类以本文件为唯一事实来源：
 * - 目录前缀规则：表层/、中层/、底层/ 三个一级目录决定页面层级；
 * - 例外覆写：个别不在层目录内、但内容属于某层的页面（如叙事与伏笔中的维斯塔黑化）。
 *
 * 本文件被 config.mts（构建期 markdown 徽标插件）与 theme/Layout.vue（页面层级横幅）共同引用。
 */

export type LayerName = '表层' | '中层' | '底层'

export interface LayerMeta {
  /** 层名键 */
  key: LayerName
  /** 单字标签（用于徽标/侧边栏） */
  label: string
  /** 横幅标题 */
  title: string
  /** 横幅描述 */
  desc: string
  /** 样式钩子（surface / mid / deep） */
  className: 'surface' | 'mid' | 'deep'
}

export const LAYERS: Record<LayerName, LayerMeta> = {
  表层: {
    key: '表层',
    label: '表',
    title: '表层设定',
    className: 'surface',
    desc: '福瑞众生所认知的世界——阳光、城邦与传说。更深层的真相，藏在带层级徽标的链接之后。'
  },
  中层: {
    key: '中层',
    label: '中',
    title: '中层真相',
    className: 'mid',
    desc: '表层背后的真实——本层内容为福瑞众生所不知晓的真相，含有剧透。'
  },
  底层: {
    key: '底层',
    label: '底',
    title: '底层规则',
    className: 'deep',
    desc: '世界的源代码——元规则层面，建议在读完中层之后再深入。'
  }
}

/** 例外覆写：相对 docs/ 的 posix 路径 → 层级 */
const OVERRIDES: Record<string, LayerName> = {
  '叙事与伏笔/维斯塔黑化.md': '底层'
}

/**
 * 根据页面相对路径（相对 docs/，含 .md）返回所属层级。
 * 门户页（主页、术语表、叙事与伏笔的伏笔总表等）返回 null，即"跨层中立页"。
 */
export function layerOf(relPath: string): LayerName | null {
  const p = relPath.replace(/\\/g, '/').replace(/^\/+/, '')
  if (OVERRIDES[p]) return OVERRIDES[p]
  for (const key of Object.keys(LAYERS) as LayerName[]) {
    if (p.startsWith(key + '/')) return key
  }
  return null
}

export function layerMetaOf(relPath: string): LayerMeta | null {
  const l = layerOf(relPath)
  return l ? LAYERS[l] : null
}
