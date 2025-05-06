<template>
  <WindowsDragBar />
  <el-config-provider :locale="zhCn" size="small">
    <div class="w-full h-full relative">
      <DarkSwitch class="absolute top-0 right-100px z-999" />
      <el-tabs v-model="activeName" type="border-card" class="app-tab">
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
import Upload from '@pages/UploadManager/Index.vue'
import GroupManager from '@pages/GroupManager/Index.vue'
import TagManager from '@pages/TagManager.vue'
import WindowsDragBar from '@components/WindowsDragBar.vue'
import DarkSwitch from '@components/DarkSwitch.vue'

import { ref } from 'vue'

const activeName = ref('Gallery')
const tabPages = [
  { label: '图库', name: 'Gallery', component: Gallery },
  { label: '上传图片', name: 'Upload', component: Upload },
  { label: '分组管理', name: 'GroupManager', component: GroupManager },
  { label: '标签管理', name: 'TagManager', component: TagManager }
]
</script>

<style scoped>
/* 禁用动画，避免切换主题闪烁 */
.app-tab :deep(.el-tabs__item) {
  transition: background-color 0s !important;
}
</style>
