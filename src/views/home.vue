<template>
  <div v-show="show" class="home">
    <div class="index-row">
      <div class="title">
        {{ $t('home.recommendPlaylist') }}
        <router-link to="/explore?category=推荐歌单">{{
          $t('home.seeMore')
        }}</router-link>
      </div>
      <CoverRow
        :type="'playlist'"
        :items="recommendPlaylist.items"
        sub-text="copywriter"
      />
    </div>
    <div class="index-row">
      <div class="title"> For You </div>
      <div class="for-you-row">
        <DailyTracksCard ref="DailyTracksCard" />
        <FMCard />
      </div>
    </div>
    <div class="index-row">
      <div class="title">{{ $t('home.recommendArtist') }}</div>
      <CoverRow
        type="artist"
        :column-number="6"
        :items="recommendArtists.items"
      />
    </div>
    <div class="index-row">
      <div class="title">
        {{ $t('home.newAlbum') }}
        <router-link to="/new-album">{{ $t('home.seeMore') }}</router-link>
      </div>
      <CoverRow
        type="album"
        :items="newReleasesAlbum.items"
        sub-text="artist"
      />
    </div>
    <div class="index-row">
      <div class="title">
        {{ $t('home.charts') }}
        <router-link to="/explore?category=排行榜">{{
          $t('home.seeMore')
        }}</router-link>
      </div>
      <CoverRow
        type="playlist"
        :items="topList.items"
        sub-text="updateFrequency"
        :image-size="1024"
      />
    </div>
  </div>
</template>

<script>
import { toplists } from '@/api/playlist';
import { toplistOfArtists } from '@/api/artist';
import { newAlbums } from '@/api/album';
import { getRecommendPlayList } from '@/utils/playList';
import NProgress from 'nprogress';
import { mapState } from 'vuex';
import CoverRow from '@/components/CoverRow.vue';
import FMCard from '@/components/FMCard.vue';
import DailyTracksCard from '@/components/DailyTracksCard.vue';

export default {
  name: 'Home',
  components: { CoverRow, FMCard, DailyTracksCard },
  data() {
    return {
      show: false,
      recommendPlaylist: { items: [] },
      newReleasesAlbum: { items: [] },
      topList: {
        items: [],
        ids: [3778678, 19723756, 2809513713, 180106, 60198],
      },
      recommendArtists: {
        items: [],
        indexs: [],
      },
    };
  },
  computed: {
    ...mapState(['settings']),
  },
  activated() {
    this.loadData();
    this.$parent.$refs.scrollbar.restorePosition();
  },
  methods: {
    loadData() {
      // 优化：使用 Promise.all 并行加载所有数据
      let progressTimer = setTimeout(() => {
        if (!this.show) NProgress.start();
      }, 1000);

      const toplistOfArtistsAreaTable = {
        all: null,
        zh: 1,
        ea: 2,
        jp: 4,
        kr: 3,
      };

      // 并行发起所有请求
      Promise.all([
        getRecommendPlayList(10, false),
        newAlbums({
          area: this.settings.musicLanguage ?? 'ALL',
          limit: 10,
        }),
        toplistOfArtists(
          toplistOfArtistsAreaTable[this.settings.musicLanguage ?? 'all']
        ),
        toplists(),
      ])
        .then(([recommendItems, albumsData, artistsData, toplistData]) => {
          // 处理推荐歌单
          this.recommendPlaylist.items = recommendItems;

          // 处理新专辑
          this.newReleasesAlbum.items = albumsData.albums;

          // 处理推荐艺术家（随机选6个）
          let indexs = [];
          while (indexs.length < 6) {
            let tmp = ~~(Math.random() * 100);
            if (!indexs.includes(tmp)) indexs.push(tmp);
          }
          this.recommendArtists.indexs = indexs;
          this.recommendArtists.items = artistsData.list.artists.filter(
            (l, index) => indexs.includes(index)
          );

          // 处理榜单
          this.topList.items = toplistData.list.filter(l =>
            this.topList.ids.includes(l.id)
          );

          // 所有数据加载完成，显示页面
          clearTimeout(progressTimer);
          NProgress.done();
          this.show = true;
        })
        .catch(error => {
          console.error('[home.vue] Failed to load data:', error);
          clearTimeout(progressTimer);
          NProgress.done();
          this.show = true; // 即使失败也显示页面
        });

      // 每日推荐独立加载（不阻塞页面显示）
      this.$refs.DailyTracksCard?.loadDailyTracks();
    },
  },
};
</script>

<style lang="scss" scoped>
.index-row {
  margin-top: 54px;
}
.index-row.first-row {
  margin-top: 32px;
}
.playlists {
  display: flex;
  flex-wrap: wrap;
  margin: {
    right: -12px;
    left: -12px;
  }
  .index-playlist {
    margin: 12px 12px 24px 12px;
  }
}

.title {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  a {
    font-size: 13px;
    font-weight: 600;
    opacity: 0.68;
  }
}

footer {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}

.for-you-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 78px;
}
</style>
