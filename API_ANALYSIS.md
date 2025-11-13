# YesPlayMusic 项目 API 分析报告

## 概述

经过深入分析，YesPlayMusic 项目中确实存在**两套独立的 API 系统**：

1. **网易云音乐官方 API**（通过 NeteaseCloudMusicApi 代理）
2. **gdmusic 第三方 API**（用于获取音频源）

## 详细分析

### 1. 网易云音乐官方 API

**配置位置**：[`src/utils/request.js`](src/utils/request.js:6-16)

**当前代理配置**：[`vercel.json`](vercel.json:2-6)
```json
{
  "rewrites": [
    {
      "source": "/api/:match*",
      "destination": "https://music-api-enhanced.332209.xyz/:match*"
    }
  ]
}
```

**用途**：处理所有非音频源的 API 请求，包括：

#### 用户相关 API (`src/api/user.js`)
- `/user/detail` - 获取用户详情
- `/user/account` - 获取账号信息
- `/user/playlist` - 获取用户歌单
- `/user/record` - 获取播放记录
- `/likelist` - 喜欢的歌曲列表
- `/daily_signin` - 每日签到
- `/album/sublist` - 收藏的专辑
- `/artist/sublist` - 收藏的歌手
- `/mv/sublist` - 收藏的MV
- `/cloud` - 上传到云盘
- `/user/cloud` - 云盘歌曲
- `/user/cloud/detail` - 云盘歌曲详情
- `/user/cloud/del` - 删除云盘歌曲

#### 歌曲相关 API (`src/api/track.js`)
- `/song/url` - 获取音乐 URL（网易云官方源）
- `/song/detail` - 获取歌曲详情
- `/lyric` - 获取歌词
- `/top/song` - 新歌速递
- `/like` - 喜欢音乐
- `/scrobble` - 听歌打卡

#### 歌单相关 API (`src/api/playlist.js`)
- `/personalized` - 推荐歌单
- `/recommend/resource` - 每日推荐歌单
- `/playlist/detail` - 歌单详情
- `/top/playlist/highquality` - 精品歌单
- `/top/playlist` - 歌单（网友精选碟）
- `/playlist/catlist` - 歌单分类
- `/toplist` - 所有榜单
- `/playlist/subscribe` - 收藏/取消收藏歌单
- `/playlist/delete` - 删除歌单
- `/playlist/create` - 新建歌单
- `/playlist/tracks` - 添加/删除歌单歌曲
- `/recommend/songs` - 每日推荐歌曲
- `/playmode/intelligence/list` - 心动模式/智能播放

#### 专辑相关 API (`src/api/album.js`)
- `/album` - 获取专辑内容
- `/album/new` - 新碟上架
- `/album/detail/dynamic` - 专辑动态信息
- `/album/sub` - 收藏/取消收藏专辑

#### 歌手相关 API (`src/api/artist.js`)
- `/artists` - 获取歌手详情
- `/artist/album` - 获取歌手专辑
- `/toplist/artist` - 歌手榜
- `/artist/mv` - 歌手MV
- `/artist/sub` - 关注/取消关注歌手
- `/simi/artist` - 相似歌手

#### MV 相关 API (`src/api/mv.js`)
- `/mv/detail` - MV详情
- `/mv/url` - MV地址
- `/simi/mv` - 相似MV
- `/mv/sub` - 收藏/取消收藏MV

#### 其他 API (`src/api/others.js`)
- `/search` - 搜索
- `/personal_fm` - 私人FM
- `/fm_trash` - FM垃圾桶

#### 认证相关 API (`src/api/auth.js`)
- `/login/cellphone` - 手机登录
- `/login` - 邮箱登录
- `/login/qr/key` - 二维码key生成
- `/login/qr/create` - 二维码生成
- `/login/qr/check` - 二维码检测
- `/login/refresh` - 刷新登录
- `/logout` - 登出

---

### 2. gdmusic 第三方 API（硬编码）

**位置**：[`src/utils/Player.js:463`](src/utils/Player.js:463)

**硬编码的 URL**：
```javascript
const apiUrl = `https://music-api.gdstudio.xyz/api.php?types=url&source=netease&id=${track.id}&br=${br}`;
```

**用途**：
- 仅用于获取音频播放源（音频文件 URL）
- 当网易云官方 API 无法提供音频源时使用
- 特别是对于**非会员用户**，可以绕过试听限制

**调用逻辑**（[`src/utils/Player.js:578-628`](src/utils/Player.js:578-628)）：

```javascript
_getAudioSource(track) {
  // 未登录时不使用新API
  if (!isAccountLoggedIn()) {
    return 缓存 → 网易云API → UnblockMusic
  }

  // 已登录用户
  const isVip = store.state.data?.user?.vipType > 0;
  
  if (isVip) {
    // 会员：优先网易云官方API（高音质）
    return Promise.race([neteaseAPI, gdmusicAPI])
  } else {
    // 非会员：优先gdmusic API（无试听限制）
    return Promise.race([gdmusicAPI, neteaseAPI])
  }
}
```

**支持的音质参数**：
- `br=128` - 标准品质 (128kbps)
- `br=192` - 较高品质 (192kbps)
- `br=320` - 高品质 (320kbps)
- `br=740` - 超高品质
- `br=999` - 无损品质

---

## Vercel 部署方案

### 问题分析

目前的配置存在以下问题：

1. ✅ **网易云 API 已配置代理**
   - `vercel.json` 中已将 `/api/*` 代理到 `https://music-api-enhanced.332209.xyz/`
   - 这部分配置完善，无需修改

2. ❌ **gdmusic API 硬编码在代码中**
   - URL 直接写在 `Player.js` 中
   - 无法通过 Vercel 配置代理
   - 需要修改代码才能实现代理

### 解决方案

#### 方案 A：保持现状（推荐）

**优点**：
- 无需修改代码
- 项目已经可以正常部署到 Vercel
- gdmusic API 直接访问，延迟可能更低

**缺点**：
- gdmusic API URL 硬编码，难以更换
- 如果 gdmusic 服务失效，需要修改代码重新部署

**部署步骤**：
1. Fork 项目到 GitHub
2. 在 Vercel 导入项目
3. 添加环境变量：`VUE_APP_NETEASE_API_URL=/api`
4. 点击部署

#### 方案 B：将 gdmusic API 也通过 Vercel 代理 ❌ 不可行

**问题**：经过测试，此方案会返回 **403 Forbidden** 错误。

**原因分析**：
1. gdmusic API（`https://music-api.gdstudio.xyz`）可能有反代理保护
2. 服务器检测到请求来自 Vercel 代理而非直接访问
3. 可能检查了 Referer、Origin 或其他请求头

**结论**：❌ **方案B不可行，不要使用此方案！**

gdmusic API 必须直接从客户端浏览器访问，不能通过 Vercel 代理。

#### 方案 C：使用环境变量配置 gdmusic API（最佳实践）

**步骤 1：添加环境变量配置**

在 `.env.example` 中添加：
```
VUE_APP_GDMUSIC_API_URL=https://music-api.gdstudio.xyz
```

**步骤 2：修改 Player.js**
```javascript
_getAudioSourceFromNewAPI(track) {
  // ... 现有代码 ...
  
  const gdmusicBaseUrl = process.env.VUE_APP_GDMUSIC_API_URL || 'https://music-api.gdstudio.xyz';
  const apiUrl = `${gdmusicBaseUrl}/api.php?types=url&source=netease&id=${track.id}&br=${br}`;
  
  // ... 其余代码 ...
}
```

**步骤 3：Vercel 配置**

选择以下任一方式：

**3a. 直接使用外部 API（无代理）**
在 Vercel 环境变量中设置：
```
VUE_APP_GDMUSIC_API_URL=https://music-api.gdstudio.xyz
```

**3b. 通过 Vercel 代理** ❌ 不可行

**注意**：经过测试，通过 Vercel 代理 gdmusic API 会返回 403 错误，因为该 API 有反代理保护。

~~修改 `vercel.json`~~（不要使用）：
```json
// ❌ 此配置不可用，会导致 403 错误
{
  "rewrites": [
    {
      "source": "/gdmusic/api.php",
      "destination": "https://music-api.gdstudio.xyz/api.php"
    }
  ]
}
```

**结论**：只能使用 **3a 方案**（直接访问外部 API）

**优点**：
- 最灵活的方案（仅限方案 3a）
- 可以在不修改代码的情况下更换 API
- 支持本地开发和生产环境使用不同的配置

**限制**：
- ❌ 不能通过 Vercel 代理（会 403）
- ✅ 只能直接访问外部 API

---

## 当前项目状态总结

### ✅ 已完成的配置

1. **vercel.json 已存在**
   - 配置了网易云 API 代理到 `https://music-api-enhanced.332209.xyz/`
   - 包含 Node.js 构建配置

2. **代码结构清晰**
   - 所有网易云 API 调用统一通过 `request.js`
   - 使用环境变量配置 API 基础路径

### ❌ 需要注意的问题

1. **gdmusic API 硬编码**
   - 位置：`src/utils/Player.js:463`
   - 无法通过配置文件修改
   - 建议采用方案 C 进行改造

2. **.env 文件不存在**
   - 仅有 `.env.example` 模板
   - 部署到 Vercel 时需要在控制台配置环境变量

---

## 推荐的部署方案

### ✅ 立即可部署（无需修改代码）- 方案 A

当前配置已经可以直接部署到 Vercel：

1. Fork 项目
2. 在 Vercel 导入项目
3. 配置环境变量：
   ```
   VUE_APP_NETEASE_API_URL=/api
   ```
4. 部署

**说明**：
- 网易云 API 通过 Vercel 代理
- gdmusic API 直接从浏览器访问（硬编码）
- ✅ 已验证可正常工作

### 💡 长期维护建议 - 方案 C（仅 3a 变体）

如果需要更灵活的配置，可以使用**方案 C 的 3a 变体**：

1. 添加 `VUE_APP_GDMUSIC_API_URL` 环境变量支持
2. 修改 `Player.js` 使用环境变量而非硬编码
3. 在 Vercel 环境变量中设置：`VUE_APP_GDMUSIC_API_URL=https://music-api.gdstudio.xyz`
4. 更新 `.env.example` 包含新的配置项

**注意**：
- ❌ 不要尝试通过 Vercel 代理 gdmusic API（会 403）
- ✅ 只能让浏览器直接访问 gdmusic API
- 但可以通过环境变量配置 URL，便于更换服务

这样可以：
- 更容易更换 API 服务（修改环境变量即可）
- 支持不同环境使用不同配置
- 提高代码的可维护性

---

## API 使用统计

| API 类型 | 数量 | 用途 | 当前状态 |
|---------|------|------|---------|
| 网易云官方 API | 40+ | 用户、歌曲、歌单、专辑、歌手、MV、搜索等 | ✅ 已配置 Vercel 代理 |
| gdmusic API | 1 | 获取音频播放源 | ❌ 硬编码，未代理 |
| UnblockMusic | 按需 | 解锁灰色歌曲（仅 Electron） | N/A（Web 版不使用）|

---

## 结论

YesPlayMusic 项目使用两套 API：
1. **网易云 API** - 已通过 Vercel 配置代理，可直接部署
2. **gdmusic API** - 硬编码在代码中，建议重构以支持配置化

**当前状态**：✅ 可以直接部署到 Vercel

**已验证的部署方案**：
- ✅ 方案 A：保持现状，直接部署（推荐）
- ❌ 方案 B：通过 Vercel 代理 gdmusic（不可行，403错误）
- ✅ 方案 C（仅3a）：使用环境变量但直接访问（可选优化）

**重要提醒**：
- 网易云 API：✅ 可以通过 Vercel 代理
- gdmusic API：❌ 不能通过 Vercel 代理（有反代理保护）
- gdmusic API：✅ 必须直接从浏览器访问