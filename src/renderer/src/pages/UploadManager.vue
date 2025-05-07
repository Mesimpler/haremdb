<template>
  <el-config-provider size="default">
    <div class="flex flex-col gap-2">
      <div class="flex justify-center">
        <Uploader
          v-model="fileList"
          :acceptable="{ name: 'Images', extensions: ['png'] }"
          class="h-140px"
          @update:model-value="(data) => (fileList = data)"
        >
          <el-text size="large">拖拽卡片到此或点击选择</el-text>
        </Uploader>
      </div>

      <el-scrollbar max-height="480px">
        <Hero v-for="file in fileList" :key="file.path" :data="file" @remove-card="removeCard" />
      </el-scrollbar>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref } from 'vue'
import { filter } from 'lodash'

import Hero from '@components/Hero.vue'
import Uploader from '@components/Uploader.vue'

const fileList = ref([])

function removeCard(file) {
  fileList.value = filter(fileList.value, (f) => f.path !== file.path)
}
</script>

<style scoped>
.dropzone {
  width: 100%;
  border: 2px dashed var(--el-border-color);
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px 8px 20px 8px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: var(--el-fill-color-extra-light);
}

.dropzone:hover,
.dropzone.dragover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.dropzone p {
  margin-bottom: 10px;
}
</style>
