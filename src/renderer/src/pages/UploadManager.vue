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
        <Hero
          v-for="file in fileList"
          :key="file.path"
          :data="file"
          @confirm="saveCard"
          @delete="removeCard"
        />
      </el-scrollbar>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, inject } from 'vue'
import { filter, cloneDeep } from 'lodash'
import { ElMessage } from 'element-plus'

import Hero from '@components/Hero/Index.vue'
import Uploader from '@components/Uploader.vue'

const fileList = ref([])
const settings = inject('app-settings', {})

function removeCard(file) {
  fileList.value = filter(fileList.value, (f) => f.path !== file.path)
}

function saveCard(file) {
  window.electron.ipcRenderer
    .invoke('db:add-image', cloneDeep(file), cloneDeep(settings.value))
    .then((result) => {
      if (result.isSuccess) {
        ElMessage.success(result.msg)
        removeCard(file)
      } else {
        console.error(result.data)
        ElMessage.error(result.msg)
      }
    })
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
