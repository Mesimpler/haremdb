<template>
  <WindowsDragBar />
  <el-config-provider
    :locale="zhCn"
    size="small"
    :message="{
      offset: 50
    }"
  >
    <div class="w-full h-full relative" @mouseleave="isInsideDrag = false">
      <DarkSwitch class="absolute top-0 right-100px z-999" />
      <el-tabs
        v-model="activeName"
        type="border-card"
        class="app-tab"
        @dragover="throttleOnDragover"
      >
        <!-- el-tab 切换逻辑是通过css控制的，所有组件都会在第一次被渲染 -->
        <el-tab-pane
          v-for="tp in tabPages"
          :key="tp.label"
          :label="tp.label"
          :name="tp.name"
        ></el-tab-pane>
        <keep-alive :exclude="excludeAlive">
          <component :is="activeComponent.component" />
        </keep-alive>
      </el-tabs>
    </div>
  </el-config-provider>
</template>

<script setup>
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import Gallery from '@pages/Gallery/Gallery.vue'
import UploadManager from '@pages/UploadManager.vue'
import GroupManager from '@pages/GroupManager/GroupManager.vue'
import TagManager from '@pages/TagManager.vue'
import Settings from '@pages/Settings.vue'

import WindowsDragBar from '@components/WindowsDragBar.vue'
import DarkSwitch from '@components/DarkSwitch.vue'

import { ref, provide, onMounted, watch, computed } from 'vue'
import _ from 'lodash'

const activeName = ref('Gallery')
const tabPages = [
  { label: 'HaremDB', name: 'Gallery', component: Gallery, keepAlive: false },
  { label: '上传图片', name: 'UploadManager', component: UploadManager, keepAlive: true },
  { label: '分组管理', name: 'GroupManager', component: GroupManager, keepAlive: false },
  { label: '标签管理', name: 'TagManager', component: TagManager, keepAlive: false },
  { label: '设置', name: 'Settings', component: Settings, keepAlive: true }
]
const excludeAlive = _.filter(tabPages, { keepAlive: false }).map((c) => c.name)
const activeComponent = computed(() => {
  return _.find(tabPages, { name: activeName.value })
})

const APP_SETTINGS = ref({
  gameRoot: '',
  showImgName: true,
  isCopyFile: true
})
provide('app-settings', APP_SETTINGS)
onMounted(() => {
  const savedSettings = localStorage.getItem('app-settings')
  if (savedSettings) {
    APP_SETTINGS.value = { ...JSON.parse(savedSettings) }
  }
})
watch(
  APP_SETTINGS,
  () => {
    localStorage.setItem('app-settings', JSON.stringify(APP_SETTINGS.value))
  },
  { deep: true }
)

const isInsideDrag = ref(false)
provide('isInsideDrag', isInsideDrag)
const throttleOnDragover = _.throttle(onDragover, 3000, { leading: true, trailing: false })
function onDragover() {
  if (!isInsideDrag.value) {
    activeName.value = 'UploadManager'
  }
}
</script>

<style scoped>
/* 禁用动画，避免切换主题闪烁 */
.app-tab :deep(.el-tabs__item) {
  transition: background-color 0s !important;
}
</style>
