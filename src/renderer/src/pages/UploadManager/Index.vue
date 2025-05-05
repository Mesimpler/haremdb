<template>
  <el-config-provider size="default">
    <div class="flex flex-col gap-2">
      <div class="flex justify-center">
        <div
          class="dropzone h-100px"
          :class="{ dragover: isDragging }"
          @click="openFilePicker"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <el-text size="large">拖拽卡片到此或点击选择</el-text>
          <input ref="fileInput" type="file" class="hidden" />
        </div>
      </div>

      <el-scrollbar max-height="450px">
        <el-card
          v-for="file in fileList"
          :key="file.path"
          shadow="never"
          class="w-100% mb-2"
          body-class="p-2 pr-3 flex bg-#FAFAFA gap-2"
        >
          <div class="w-140px min-h-180px h-auto flex flex-col">
            <el-image
              class="block border-el h-full"
              loading="lazy"
              cover
              :src="`local-resource://${file.path}`"
            />
            <el-text size="large" class="w-140px text-align-center" truncated></el-text>
          </div>
          <div class="w-full flex flex-col gap-2">
            <TagSelect v-model="file.tags" />
            <el-input
              v-model="file.remark"
              type="textarea"
              resize="none"
              input-style="height: 100%"
              placeholder="图片备注"
              class="h-full"
            />
            <div class="flex justify-between gap-4">
              <el-input v-model="file.name" placeholder="Please input">
                <template #prepend>文件名</template>
              </el-input>
              <div class="flex h-auto">
                <el-button type="danger" plain icon="Delete" @click="onRemove(file)"></el-button>
                <el-button
                  type="success"
                  plain
                  icon="CircleCheck"
                  @click="onSave(file)"
                ></el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-scrollbar>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref } from 'vue'
import { cloneDeep, filter, findIndex } from 'lodash'
import TagSelect from '@components/TagSelect.vue'
import { ElMessage } from 'element-plus'

const fileList = ref([])
const isDragging = ref(false)
function openFilePicker() {
  window.electron.ipcRenderer
    .invoke('showOpenDialog', {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: ['png'] }]
    })
    .then((files) => {
      const newFiles = filter(files, (file) => {
        const isIncluded = findIndex(fileList.value, { path: file.path }) !== -1
        return !isIncluded
      })
      fileList.value = newFiles.concat(fileList.value)
    })
}
function handleDrop(event) {
  isDragging.value = false
  fileList.value = fileList.value.concat(window.api.getDropFilesPath(event.dataTransfer.files))
}

function onRemove(file) {
  fileList.value = filter(fileList.value, function (f) {
    return f.path !== file.path
  })
}
function onSave(file) {
  window.electron.ipcRenderer.invoke('db:add-image', cloneDeep(file)).then((result) => {
    if (result.isSuccess) {
      onRemove(file)
      ElMessage.success(result.msg)
    } else {
      console.log(result.data)
      ElMessage.error(result.data.toString())
    }
  })
}
</script>

<style scoped>
.dropzone {
  width: 100%;
  height: 160px;
  border: 2px dashed #ccc;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.dropzone:hover,
.dropzone.dragover {
  border-color: #2196f3;
  background: #f5f5f5;
}

.dropzone p {
  color: #666;
  margin-bottom: 10px;
}
</style>
