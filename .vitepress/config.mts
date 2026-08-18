import { defineConfig } from 'vitepress'
import type { DefaultTheme } from 'vitepress'
import { posix } from 'node:path'
import { layerOf } from './layers'

/**
 * 中日韩文本分词器：把一段文本拆成「单字 + 双字词 + 短词整体」，
 * 供 MiniSearch 索引与查询共用（查询与索引必须使用同一分词规则）。
 * 这是本地中文全文搜索能正常工作的关键。
 */
function cjkTokenize(text: string): string[] {
  const tokens = new Set<string>()
  const runs = text.match(/[\u3400-\u9fff\uf900-\ufaff]+|[a-zA-Z0-9_-]+/g) ?? []
  for (const run of runs) {
    if (/^[\u3400-\u9fff\uf900-\ufaff]/.test(run)) {
      for (const ch of run) tokens.add(ch)
      for (let i = 0; i < run.length - 1; i++) tokens.add(run.slice(i, i + 2))
      if (run.length <= 3) tokens.add(run)
    } else {
      tokens.add(run.toLowerCase())
    }
  }
  return [...tokens]
}

/** 把链接 href 相对当前源文件解析为相对 docs/ 的规范路径（用于层级判定） */
function resolveDocPath(srcRel: string, href: string): string {
  // markdown-it 在解析阶段会对 href 做百分号编码，先解码再解析
  let clean = href.replace(/[?#].*$/, '')
  try {
    clean = decodeURIComponent(clean)
  } catch {
    /* 保持原样 */
  }
  if (!clean) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(clean)) return ''
  if (clean.startsWith('//')) return ''
  if (clean.startsWith('/')) return clean.replace(/^\/+/, '')
  const dir = posix.dirname(srcRel.replace(/\\/g, '/'))
  const joined = dir === '.' ? clean : posix.join(dir, clean)
  return posix.normalize(joined).replace(/^\/+/, '')
}

/**
 * 层级徽标插件：
 * 自动为所有"跨层"内部链接附加 [表层]/[中层]/[底层] 徽标。
 * - 当前页属于某层、目标页属于另一层 → 加徽标；
 * - 门户中立页（主页/术语表/伏笔总表）指向任何层 → 加徽标；
 * - 同层链接、纯锚点、外链 → 不加。
 * 零正文改动，构建期与开发模式同时生效。
 */
function layerBadgePlugin(md: any) {
  md.core.ruler.after('inline', 'layer_badges', (state: any) => {
    const srcRel = String(state.env?.relativePath ?? '').replace(/\\/g, '/')
    const srcLayer = layerOf(srcRel)
    const walk = (tokens: any[]) => {
      for (const t of tokens) {
        if (t.type === 'link_open') {
          const href = t.attrGet('href') ?? ''
          const target = resolveDocPath(srcRel, href)
          if (target) {
            const dstLayer = layerOf(target)
            if (dstLayer && dstLayer !== srcLayer) {
              t.attrJoin('class', 'layer-link')
              t.attrSet('data-layer', dstLayer)
            }
          }
        } else if (t.children?.length) {
          walk(t.children)
        }
      }
    }
    walk(state.tokens)
    return false
  })
}

const sidebar: DefaultTheme.Sidebar = {
  '/表层/': [
    { text: '表层 · 阳光下的世界', link: '/表层/' },
    { text: '种族总览', link: '/表层/种族总览' },
    {
      text: '表层历史',
      collapsed: false,
      items: [
        { text: '总览', link: '/表层/历史/' },
        { text: '共同体时期', link: '/表层/历史/共同体时期' },
        { text: '黑暗时代', link: '/表层/历史/黑暗时代' },
        { text: '当前时代', link: '/表层/历史/当前时代' }
      ]
    },
    {
      text: '种族设定',
      collapsed: true,
      items: [
        { text: '总览', link: '/表层/种族/' },
        { text: '五大主族总览', link: '/表层/种族/五大主族总览' },
        { text: '牛族', link: '/表层/种族/牛族' },
        { text: '鹿族', link: '/表层/种族/鹿族' },
        { text: '鹤族', link: '/表层/种族/鹤族' },
        { text: '熊族', link: '/表层/种族/熊族' },
        { text: '甲族', link: '/表层/种族/甲族' },
        { text: '狼族', link: '/表层/种族/狼族' },
        { text: '狐族', link: '/表层/种族/狐族' },
        { text: '兔族', link: '/表层/种族/兔族' },
        { text: '鸽族', link: '/表层/种族/鸽族' },
        { text: '鹰族', link: '/表层/种族/鹰族' },
        { text: '蜥族', link: '/表层/种族/蜥族' },
        { text: '龙族', link: '/表层/种族/龙族' },
        { text: '猫族', link: '/表层/种族/猫族' },
        { text: '焰种', link: '/表层/种族/焰种' },
        { text: '精灵族', link: '/表层/种族/精灵族' }
      ]
    },
    {
      text: '地理环境',
      collapsed: true,
      items: [
        { text: '总览', link: '/表层/地理/' },
        { text: '自然生态', link: '/表层/地理/自然生态' },
        { text: '古代遗迹', link: '/表层/地理/古代遗迹' }
      ]
    },
    {
      text: '众生录 · 表层人物',
      collapsed: false,
      items: [
        { text: '总览', link: '/表层/人物/' },
        { text: '维斯塔', link: '/表层/人物/维斯塔' },
        { text: '拉斯塔', link: '/表层/人物/拉斯塔' },
        { text: '狼族少年', link: '/表层/人物/狼族少年' },
        { text: '艾莉芙', link: '/表层/人物/艾莉芙' },
        { text: '古斯塔夫', link: '/表层/人物/古斯塔夫' },
        { text: '龙鹿', link: '/表层/人物/龙鹿' },
        { text: '小白狼', link: '/表层/人物/小白狼' }
      ]
    }
  ],
  '/中层/': [
    { text: '中层 · 背后的真相', link: '/中层/' },
    {
      text: '世界真相',
      collapsed: false,
      items: [
        { text: '历代三神', link: '/中层/世界/历代三神' },
        { text: '地脉与魔法', link: '/中层/世界/地脉与魔法' },
        { text: '神机谋划', link: '/中层/世界/神机谋划' },
        { text: '太空巨构', link: '/中层/世界/太空巨构' },
        { text: '太空清除计划', link: '/中层/世界/太空清除计划' },
        { text: '特殊地点', link: '/中层/世界/特殊地点' },
        { text: '龙族真相', link: '/中层/世界/龙族真相' }
      ]
    },
    {
      text: '历史真相',
      collapsed: false,
      items: [
        { text: '总览', link: '/中层/历史/' },
        { text: '正传历史', link: '/中层/历史/正传历史' },
        { text: '火种故事', link: '/中层/历史/火种故事' },
        { text: '间章历史', link: '/中层/历史/间章历史' },
        { text: '前传历史', link: '/中层/历史/前传历史' },
        { text: '前传超算纪元', link: '/中层/历史/前传超算纪元' }
      ]
    },
    {
      text: '人物真相档案',
      collapsed: true,
      items: [
        { text: '总览', link: '/中层/人物/' },
        { text: '神机', link: '/中层/人物/神机' },
        { text: '维斯塔', link: '/中层/人物/维斯塔' },
        { text: '拉斯塔', link: '/中层/人物/拉斯塔' },
        { text: '狼族少年', link: '/中层/人物/狼族少年' },
        { text: '奥克尔', link: '/中层/人物/奥克尔' },
        { text: '古斯塔夫', link: '/中层/人物/古斯塔夫' },
        { text: '龙鹿', link: '/中层/人物/龙鹿' },
        { text: '神机与维斯塔', link: '/中层/人物/神机与维斯塔' }
      ]
    }
  ],
  '/底层/': [
    { text: '底层 · 世界的源代码', link: '/底层/' },
    {
      text: '世界规则',
      collapsed: false,
      items: [
        { text: '基底层与现实世界', link: '/底层/规则/基底层与现实世界' },
        { text: '神权体系', link: '/底层/规则/神权体系' },
        { text: '叙事与玩家', link: '/底层/规则/叙事与玩家' }
      ]
    },
    {
      text: '元层面人物',
      collapsed: false,
      items: [
        { text: '总览', link: '/底层/人物/' },
        { text: '初代创造神', link: '/底层/人物/初代创造神' },
        { text: '初代变化神', link: '/底层/人物/初代变化神' },
        { text: '上位毁灭神', link: '/底层/人物/上位毁灭神' },
        { text: '林月', link: '/底层/人物/林月' }
      ]
    }
  ],
  '/叙事与伏笔/': [
    { text: '叙事与伏笔总览', link: '/叙事与伏笔/' },
    { text: '伏笔洋葱层分类', link: '/叙事与伏笔/伏笔洋葱层分类' },
    { text: '维斯塔黑化 · 平行世界', link: '/叙事与伏笔/维斯塔黑化' }
  ]
}

export default defineConfig({
  lang: 'zh-CN',
  title: '神造物 Wiki',
  titleTemplate: ':title · 神造物 Wiki',
  description:
    '《神造物》世界观档案库——一个阳光明媚的福瑞奇幻世界，以及藏在它底下的、层层叠叠的真相。',
  srcDir: 'docs',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#cf4a3c' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: '神造物 Wiki' }],
    [
      'meta',
      {
        property: 'og:description',
        content: '《神造物》世界观档案库——一个阳光明媚的福瑞奇幻世界，以及藏在它底下的、层层叠叠的真相。'
      }
    ]
  ],
  themeConfig: {
    logo: '/favicon.svg',
    appearance: 'dark',
    nav: [
      { text: '表层', link: '/表层/' },
      { text: '中层', link: '/中层/' },
      { text: '底层', link: '/底层/' },
      { text: '叙事与伏笔', link: '/叙事与伏笔/' },
      { text: '术语表与索引指南', link: '/术语表与索引指南' }
    ],
    sidebar,
    outline: {
      level: [2, 3],
      label: '本页目录'
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '检索档案',
            buttonAriaLabel: '检索档案'
          },
          modal: {
            noResultsText: '未找到相关档案'
          }
        },
        miniSearch: {
          options: {
            tokenize: cjkTokenize,
            processTerm: (term: string) => term.toLowerCase()
          },
          searchOptions: {
            combineWith: 'AND',
            boost: { title: 4, headers: 2, text: 1 }
          }
        }
      }
    }
  },
  markdown: {
    lineNumbers: false,
    config: (md) => {
      layerBadgePlugin(md)
    }
  }
})
