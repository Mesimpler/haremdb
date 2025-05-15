<template>
  <el-config-provider size="default">
    <div class="flex flex-col gap-2">
      <div class="flex justify-center">
        <Uploader
          v-model="fileList"
          :acceptable="{ name: 'Images', extensions: ['png'] }"
          :folder-mode="allowUploadFolder"
          class="h-140px"
          @update:model-value="(data) => (fileList = data)"
        >
          <el-text size="large">拖拽卡片到此或点击选择</el-text>
          <el-checkbox v-model="allowUploadFolder" @click.stop>
            <el-text type="info">上传文件夹，并根据文件夹层级自动打标</el-text>
          </el-checkbox>
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
const allowUploadFolder = ref(false)

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

<style scoped></style>
