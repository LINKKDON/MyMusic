import router from '../router';
import state from '../store/state';
import {
  recommendPlaylist,
  dailyRecommendPlaylist,
} from '@/api/playlist';
import { isAccountLoggedIn } from '@/utils/auth';

export function hasListSource() {
  return !state.player.isPersonalFM && state.player.playlistSource.id !== 0;
}

export function goToListSource() {
  router.push({ path: getListSourcePath() });
}

export function getListSourcePath() {
  if (state.player.playlistSource.id === state.data.likedSongPlaylistID) {
    return '/library/liked-songs';
  } else if (state.player.playlistSource.type === 'url') {
    return state.player.playlistSource.id;
  } else if (state.player.playlistSource.type === 'cloudDisk') {
    return '/library';
  } else {
    return `/${state.player.playlistSource.type}/${state.player.playlistSource.id}`;
  }
}

export async function getRecommendPlayList(limit, removePrivateRecommand) {
  if (isAccountLoggedIn()) {
    const playlists = await Promise.all([
      dailyRecommendPlaylist(),
      recommendPlaylist({ limit }),
    ]);
    let recommend = playlists[0].recommend ?? [];
    if (recommend.length) {
      if (removePrivateRecommand) recommend = recommend.slice(1);
      await replaceRecommendResult(recommend);
    }
    return recommend.concat(playlists[1].result).slice(0, limit);
  } else {
    const response = await recommendPlaylist({ limit });
    return response.result;
  }
}

async function replaceRecommendResult(recommend) {
  // 优化：特殊歌单已经在 dailyRecommendPlaylist 中包含了名称和封面
  // 无需再次请求完整的歌单详情（会返回几MB的数据）
  // 如果需要更新，直接使用已有数据即可
  for (let r of recommend) {
    if (specialPlaylist.indexOf(r.id) > -1) {
      // 特殊歌单的名称和封面已经在 recommend 数据中
      // 不再请求详情，避免大数据量传输
      console.debug(`[playList] 跳过特殊歌单 ${r.id} 的详情请求，使用已有数据`);
    }
  }
}

const specialPlaylist = [3136952023, 2829883282, 2829816518, 2829896389];
