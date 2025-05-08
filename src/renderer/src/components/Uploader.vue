<template>
  <div
    class="dropzone"
    :class="{ dragover: isDragging }"
    v-bind="$attrs"
    :preventOpenDialog="preventOpenDialog"
    @click.stop="openFilePicker"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="handleFileDrop"
  >
    <input ref="fileInput" type="file" class="hidden" />
    <slot>
      <el-text size="large">拖拽文件到此或点击选择</el-text>
    </slot>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { uniqBy, filter, cloneDeep } from 'lodash'

const fileList = defineModel({
  type: Array
})
const emit = defineEmits(['update:modelValue'])

const props = defineProps({
  acceptable: Object,
  preventOpenDialog: {
    default: false,
    type: Boolean
  },
  updateFileList: Function
})

const isDragging = ref(false)
function openFilePicker() {
  if (props.preventOpenDialog) return
  window.electron.ipcRenderer
    .invoke('showOpenDialog', {
      properties: ['openFile', 'multiSelections'],
      filters: [props.acceptable]
    })
    .then((files) => {
      emit('update:modelValue', uniqBy(fileList.value.concat(files), 'path'))
    })
}
function handleFileDrop(event) {
  isDragging.value = false
  const dropInFiles = window.api.getDropFilesPath(event.dataTransfer.files)
  const pngFiles = filter(dropInFiles, (f) => {
    return props.acceptable.extensions.some((ext) => f.name.endsWith(ext))
  })
  emit('update:modelValue', uniqBy(cloneDeep(fileList.value.concat(pngFiles)), 'path'))
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
