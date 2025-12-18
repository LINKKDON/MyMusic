<p align="center">
  <img src="images/logo.png" alt="Logo" width="156" height="156">
  <h2 align="center">MyMusic</h2>
  <p align="center">高颜值的第三方网易云播放器</p>
</p>

<p align="center">
  <a href="#-特性">特性</a> •
  <a href="#️-部署至-vercel">部署</a> •
  <a href="#-本地开发">开发</a>
</p>

---

## ✨ 特性

- ✅ **现代架构**：使用 Vue.js 全家桶开发
- 🔴 **账号支持**：网易云账号登录（扫码/手机/邮箱登录）
- 📺 **丰富媒体**：支持 MV 播放
- 📃 **沉浸体验**：支持歌词显示 / **黑胶唱片模式** (New!)
- 📻 **发现音乐**：支持私人 FM / 每日推荐歌曲
- 🚫 **纯净无扰**：无任何社交功能
- 🌎️ **解锁限制**：海外用户可直接播放（需登录）
- 🔐 **自动解灰**：内置 UnblockNeteaseMusic，自动替换变灰歌曲
- 🌚 **主题切换**：Light/Dark Mode 自动切换
- 🖥️ **跨平台**：支持 PWA，可在 Chrome/Edge 安装
- 🟥 **数据同步**：支持 Last.fm Scrobble
- ☁️ **云端存储**：支持音乐云盘
- ⌨️ **高效操作**：自定义快捷键和全局快捷键

## ⚙️ 部署至 Vercel

本项目经过优化，支持 Vercel 一键部署，并采用 **Serverless Proxy** 技术隐藏真实 API 地址，同时自动解决 CORS 跨域问题。

### 1️⃣ 准备工作

1.  **Fork** 本仓库到 GitHub。
2.  准备好 **网易云音乐 API** 服务地址 (例如 `https://netease-cloud-music-api-demo.vercel.app`)。
3.  (可选) 申请 **Last.fm API** 用于同步听歌记录。

### 2️⃣ Vercel 配置

在 Vercel 导入项目时（或在 Settings -> Environment Variables 中），添加以下环境变量：

| 变量名 | 必填 | 描述 | 示例值 |
| :--- | :--- | :--- | :--- |
| `VUE_APP_NETEASE_API_URL` | ✅ | 前端请求路径 | `/api` (固定值) |
| `REAL_API_URL` | ✅ | **真实 API 地址** | `https://your-api.vercel.app` (无末尾斜杠) |
| `VUE_APP_LASTFM_API_KEY` | ❌ | Last.fm API Key | `4bdebce...` |
| `VUE_APP_LASTFM_API_SHARED_SECRET` | ❌ | Last.fm Secret | `8714e2...` |

### 3️⃣ 原理说明

本项目通过 `api/proxy.js` 拦截所有 `/api` 请求，并将其安全转发到 `REAL_API_URL`。
*   ✅ **隐私保护**：真实 API 地址不暴露在前端。
*   ✅ **解决跨域**：由后端代为请求，浏览器无 CORS 限制。

### ⚠️ 可选：硬编码方式 (不推荐)

若不配置 `REAL_API_URL` 环境变量，也可直接修改代码（这将导致 API 地址公开在代码库中）。

1.  修改 `vercel.json`：
    ```json
    {
      "rewrites": [
        {
          "source": "/api/:match*",
          "destination": "https://your-api-url.vercel.app/:match*"
        }
      ]
    }
    ```
2.  删除 `api/proxy.js` 文件（可选）。

## 💻 本地开发

### 环境要求
- Node.js 16+
- Yarn

### 启动步骤

```bash
# 1. 克隆仓库
git clone https://github.com/LINKKDON/MyMusic.git

# 2. 安装依赖
yarn install

# 3. 配置环境变量
# 在项目根目录创建 .env.local 文件，并填入上述环境变量
# 例如：
# VUE_APP_NETEASE_API_URL=/api
# REAL_API_URL=https://your-api.vercel.app

# 4. 启动开发服务器
yarn serve
```

## 📜 开源许可

本项目仅供个人学习研究使用，禁止用于商业及非法用途。
基于 [MIT License](https://opensource.org/licenses/MIT) 许可进行开源。

## 🙏 鸣谢

<p align="center">
  原项目: <a href="https://github.com/qier222/YesPlayMusic">YesPlayMusic</a>
  <br>
  API: <a href="https://github.com/Binaryify/NeteaseCloudMusicApi">NeteaseCloudMusicApi</a>
  <br>
  第三方 API: <a href="https://tunefree.fun">TuneHub</a>
  <br>
  设计灵感: Apple Music • YouTube Music • Spotify
</p>
