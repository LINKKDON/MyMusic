<p align="center">
  <img src="images/logo.png" alt="Logo" width="156" height="156">
  <h2 align="center">YesPlayMusic</h2>
  <p align="center">高颜值的第三方网易云播放器</p>
</p>

<p align="center">
  <a href="#-特性">特性</a> •
  <a href="#️-安装">安装</a> •
  <a href="#️-部署至-vercel">部署</a> •
  <a href="#-开发">开发</a>
</p>

---

## ✨ 特性

- ✅ 使用 Vue.js 全家桶开发
- 🔴 网易云账号登录（扫码/手机/邮箱登录）
- 📺 支持 MV 播放
- 📃 支持歌词显示
- 📻 支持私人 FM / 每日推荐歌曲
- 🚫🤝 无任何社交功能
- 🌎️ 海外用户可直接播放（需要登录网易云账号）
- 🔐 支持 UnblockNeteaseMusic，自动使用各类音源替换变灰歌曲链接（网页版不支持）
- 🌚 Light/Dark Mode 自动切换
- 🖥️ 支持 PWA，可在 Chrome/Edge 里安装到电脑
- 🟥 支持 Last.fm Scrobble
- ☁️ 支持音乐云盘
- ⌨️ 自定义快捷键和全局快捷键

## 📦️ 安装

支持 macOS、Windows、Linux 平台。

访问本项目的 **Releases** 页面下载安装包。

**包管理器安装：**

```bash
# macOS
brew install --cask yesplaymusic

# Windows
scoop install extras/yesplaymusic
```

## ⚙️ 部署至 Vercel

[![Powered by Vercel](https://www.datocms-assets.com/31049/1618983297-powered-by-vercel.svg)](https://vercel.com/?utm_source=ohmusic&utm_campaign=oss)

### 📋 API 代理架构

本项目采用双 API 代理架构，通过 Vercel 统一管理：

| API 类型              | 路径                    | 用途                                 |
| --------------------- | ----------------------- | ------------------------------------ |
| 🎵 **网易云音乐 API** | `/api/*`                | 用户登录、歌单管理、专辑信息、搜索等 |
| 🎧 **音乐源 API**     | `/music-source/api.php` | 获取高品质音频播放源，解决试听限制   |

### 🚀 快速部署

#### 1️⃣ 准备 API 服务

部署网易云 API → [查看教程]([https://github.com/Binaryify/NeteaseCloudMusicApi#%E9%83%A8%E7%BD%B2](https://neteasecloudmusicapienhanced.js.org/#/?id=%e5%ae%89%e8%a3%85)

💡 推荐使用增强版 API，支持更多功能，推荐部署到 Vercel

#### 2️⃣ Fork 本仓库

点击右上角 **Fork** 按钮

#### 3️⃣ 配置 API 代理

创建或修改 `vercel.json`：

```json
{
  "rewrites": [
    {
      "source": "/api/:match*",
      "destination": "https://your-netease-api.example.com/:match*"
    },
    {
      "source": "/music-source/api.php",
      "destination": "https://your-music-source-api.example.com/api.php"
    }
  ]
}
```

**替换地址：**

- `your-netease-api.example.com` → 你的网易云 API 地址
- `your-music-source-api.example.com` → 你的音乐源 API 地址

#### 4️⃣ 部署到 Vercel

1. 打开 [Vercel.com](https://vercel.com)，用 GitHub 登录
2. Import 你 Fork 的仓库
3. 添加环境变量：
   - `VUE_APP_NETEASE_API_URL` = `/api`
4. 点击 Deploy 🎉

### 🔧 维护

**更换 API：** 修改 `vercel.json` 中的 `destination` 字段

**API 路径变更：**

1. 修改 `vercel.json` 中的 `source` 和 `destination`
2. 修改 `src/utils/Player.js` 第 473 行的对应路径

## 💻 开发

### 环境要求

- Node.js
- Yarn
- [NeteaseCloudMusicApiEnhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)

### 本地运行

```bash
# 克隆仓库
git clone --recursive https://github.com/LINKKDON/MyMusic.git

# 安装依赖
yarn install

# 配置环境变量
cp .env.example .env

# 运行网页端
yarn serve

# 运行 Electron
yarn electron:serve
```

### 打包客户端

```bash
# Windows 32位
yarn electron:build --windows nsis:ia32

# Windows ARM
yarn electron:build --windows nsis:arm64

# Linux ARM
yarn electron:build --linux deb:armv7l

# macOS ARM
yarn electron:build --macos dir:arm64
```

## 📜 开源许可

本项目仅供个人学习研究使用，禁止用于商业及非法用途。

基于 [MIT License](https://opensource.org/licenses/MIT) 许可进行开源。

## 🙏 鸣谢

- API: [NeteaseCloudMusicApiEnhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)
- 设计灵感: Apple Music • YouTube Music • Spotify
