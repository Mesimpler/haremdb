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

      <el-scrollbar max-height="480px">
        <el-card
          v-for="file in fileList"
          :key="file.path"
          shadow="never"
          class="w-100% mb-2 img-panel"
          body-class="p-2 pr-3 flex gap-2"
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
import _, { cloneDeep, filter } from 'lodash'
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
      fileList.value = _.uniq(fileList.value.concat(files), 'path')
    })
}
function handleDrop(event) {
  isDragging.value = false
  fileList.value = fileList.value.concat(window.api.getDropFilesPath(event.dataTransfer.files))
}

function onRemove(file) {
  fileList.value = filter(fileList.value, (f) => f.path !== file.path)
}
function onSave(file) {
  window.electron.ipcRenderer.invoke('db:add-image', cloneDeep(file)).then((result) => {
    if (result.isSuccess) {
      onRemove(file)
      ElMessage.success(result.msg)
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
  height: 160px;
  border: 2px dashed var(--el-border-color);
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
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
