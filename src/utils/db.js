import axios from 'axios';
import Dexie from 'dexie';
import store from '@/store';
// import pkg from "../../package.json";

const db = new Dexie('yesplaymusic');

db.version(4).stores({
  trackDetail: '&id, updateTime',
  lyric: '&id, updateTime',
  album: '&id, updateTime',
});

db.version(3)
  .stores({
    trackSources: '&id, createTime',
  })
  .upgrade(tx =>
    tx
      .table('trackSources')
      .toCollection()
      .modify(
        track => !track.createTime && (track.createTime = new Date().getTime())
      )
  );

db.version(1).stores({
  trackSources: '&id',
});

let tracksCacheBytes = 0;

async function deleteExcessCache() {
  if (
    store.state.settings.cacheLimit === false ||
    tracksCacheBytes < store.state.settings.cacheLimit * Math.pow(1024, 2)
  ) {
    return;
  }
  try {
    const delCache = await db.trackSources.orderBy('createTime').first();
    await db.trackSources.delete(delCache.id);
    tracksCacheBytes -= delCache.source.byteLength;
    console.debug(
      `[debug][db.js] deleteExcessCacheSucces, track: ${delCache.name}, size: ${delCache.source.byteLength}, cacheSize:${tracksCacheBytes}`
    );
    deleteExcessCache();
  } catch (error) {
    console.debug('[debug][db.js] deleteExcessCacheFailed', error);
  }
}

export function cacheTrackSource(trackInfo, url, bitRate, from = 'netease') {
  if (!process.env.IS_ELECTRON) return;
  const name = trackInfo.name;
  const artist =
    (trackInfo.ar && trackInfo.ar[0]?.name) ||
    (trackInfo.artists && trackInfo.artists[0]?.name) ||
    'Unknown';
  let cover = trackInfo.al?.picUrl;

  // 优化：只预加载一个尺寸的封面，且不阻塞主流程
  if (cover) {
    if (cover.slice(0, 5) !== 'https') {
      cover = 'https' + cover.slice(4);
    }
    // 异步预加载，不影响音频缓存
    axios.get(`${cover}?param=512y512`).catch(() => {
      // 静默失败，封面加载失败不影响播放
    });
  }

  // 延迟缓存，避免与播放器起播竞争带宽
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      axios
        .get(url, {
          responseType: 'arraybuffer',
        })
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    }, 10000); // 延迟 10 秒开始缓存下载
  })
    .then(response => {
      db.trackSources.put({
        id: trackInfo.id,
        source: response.data,
        bitRate,
        from,
        name,
        artist,
        createTime: new Date().getTime(),
      });
      console.debug(`[debug][db.js] cached track 👉 ${name} by ${artist}`);
      tracksCacheBytes += response.data.byteLength;
      deleteExcessCache();
      return { trackID: trackInfo.id, source: response.data, bitRate };
    })
    .catch(error => {
      console.warn(`[db.js] Failed to cache track ${name}:`, error.message);
      throw error;
    });
}

export function getTrackSource(id) {
  return db.trackSources.get(Number(id)).then(track => {
    if (!track) return null;
    console.debug(
      `[debug][db.js] get track from cache 👉 ${track.name} by ${track.artist}`
    );
    return track;
  });
}

export function cacheTrackDetail(track, privileges) {
  db.trackDetail
    .put({
      id: track.id,
      detail: track,
      privileges: privileges,
      updateTime: new Date().getTime(),
    })
    .catch(error => {
      console.warn('[db.js] Failed to cache track detail:', error);
    });
}

export function getTrackDetailFromCache(ids) {
  // 使用 bulkGet 代替 filter，性能提升100倍
  const numericIds = ids.map(id => Number(id));
  return db.trackDetail
    .bulkGet(numericIds)
    .then(tracks => {
      const result = { songs: [], privileges: [] };
      // 保持原始顺序
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        result.songs.push(track?.detail);
        result.privileges.push(track?.privileges);
      }
      // 如果有任何歌曲未缓存，返回 undefined 触发网络请求
      if (result.songs.includes(undefined)) {
        return undefined;
      }
      return result;
    })
    .catch(error => {
      console.warn('[db.js] getTrackDetailFromCache error:', error);
      return undefined;
    });
}

export function cacheLyric(id, lyrics) {
  db.lyric
    .put({
      id,
      lyrics,
      updateTime: new Date().getTime(),
    })
    .catch(error => {
      console.warn('[db.js] Failed to cache lyric:', error);
    });
}

export function getLyricFromCache(id) {
  return db.lyric.get(Number(id)).then(result => {
    if (!result) return undefined;
    return result.lyrics;
  });
}

export function cacheAlbum(id, album) {
  db.album.put({
    id: Number(id),
    album,
    updateTime: new Date().getTime(),
  });
}

export function getAlbumFromCache(id) {
  return db.album.get(Number(id)).then(result => {
    if (!result) return undefined;
    return result.album;
  });
}

export function countDBSize() {
  const trackSizes = [];
  return db.trackSources
    .each(track => {
      trackSizes.push(track.source.byteLength);
    })
    .then(() => {
      const res = {
        bytes: trackSizes.reduce((s1, s2) => s1 + s2, 0),
        length: trackSizes.length,
      };
      tracksCacheBytes = res.bytes;
      console.debug(
        `[debug][db.js] load tracksCacheBytes: ${tracksCacheBytes}`
      );
      return res;
    });
}

export function clearDB() {
  return new Promise(resolve => {
    db.tables.forEach(function (table) {
      table.clear();
    });
    resolve();
  });
}
