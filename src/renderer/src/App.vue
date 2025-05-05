<template>
  <el-config-provider :locale="zhCn" size="small">
    <div class="w-full h-full">
      <el-tabs v-model="activeName" type="border-card">
        <el-tab-pane label="图库" name="Gallery">
          <Gallery v-if="activeName === 'Gallery'" />
        </el-tab-pane>
        <el-tab-pane label="上传图片" name="Upload">
          <Upload />
        </el-tab-pane>
        <el-tab-pane label="分组管理" name="GroupManager">
          <GroupManager v-if="activeName === 'GroupManager'" />
        </el-tab-pane>
        <el-tab-pane label="标签管理" name="TagManager">
          <TagManager v-if="activeName === 'TagManager'" />
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

import { ref } from 'vue'

const activeName = ref('Gallery')
</script>

<style scoped></style>
