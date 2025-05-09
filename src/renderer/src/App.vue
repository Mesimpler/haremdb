<template>
  <WindowsDragBar class="!w-260px !opacity-0" />
  <el-config-provider
    :locale="zhCn"
    size="small"
    :message="{
      offset: 50
    }"
  >
    <div class="w-full h-full relative">
      <DarkSwitch class="absolute top-0 right-100px z-999" />
      <el-tabs
        v-model="activeName"
        type="border-card"
        class="app-tab"
        @dragover="throttleOnDragover"
      >
        <!-- el-tab 切换逻辑是通过css控制的，不会触发组件的 onMounted 方法 -->
        <el-tab-pane v-for="tp in tabPages" :key="tp.label" :label="tp.label" :name="tp.name">
          <component :is="tp.component" v-if="activeName === tp.name" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-config-provider>
</template>

<script setup>
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import Gallery from '@pages/Gallery/Index.vue'
import UploadManager from '@pages/UploadManager.vue'
import GroupManager from '@pages/GroupManager/Index.vue'
import TagManager from '@pages/TagManager.vue'
import Settings from '@pages/Settings.vue'

import WindowsDragBar from '@components/WindowsDragBar.vue'
import DarkSwitch from '@components/DarkSwitch.vue'

import { ref, provide, onMounted, watch } from 'vue'
import _ from 'lodash'

const activeName = ref('Gallery')
const tabPages = [
  { label: 'HaremDB', name: 'Gallery', component: Gallery },
  { label: '上传图片', name: 'UploadManager', component: UploadManager },
  { label: '分组管理', name: 'GroupManager', component: GroupManager },
  { label: '标签管理', name: 'TagManager', component: TagManager },
  { label: '设置', name: 'Settings', component: Settings }
]

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

document.addEventListener('dragleave', (e) => {
  e.preventDefault()
  e.stopPropagation()
})
</script>

<style scoped>
/* 禁用动画，避免切换主题闪烁 */
.app-tab :deep(.el-tabs__item) {
  transition: background-color 0s !important;
}
</style>
