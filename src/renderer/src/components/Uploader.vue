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
import { ref, inject } from 'vue'
import { uniqBy, filter, cloneDeep, isEmpty } from 'lodash'
import { ElMessage } from 'element-plus'

const fileList = defineModel({
  type: Array
})
const emit = defineEmits(['update:modelValue'])
const settings = inject('app-settings', {})

const props = defineProps({
  acceptable: Object,
  preventOpenDialog: {
    default: false,
    type: Boolean
  },
  folderMode: {
    default: false,
    type: Boolean
  },
  updateFileList: Function,
  rejectWhenGameRootNoSet: {
    default: false,
    type: Boolean
  }
})

const isDragging = ref(false)
function openFilePicker() {
  if (props.preventOpenDialog) return

  if (props.rejectWhenGameRootNoSet && isEmpty(settings.value.gameRoot)) {
    ElMessage.warning('游戏根目录未设置, 操作拒绝')
    return
  }

  const open = props.folderMode ? 'openDirectory' : 'openFile'

  window.electron.ipcRenderer
    .invoke('showOpenDialog', {
      properties: [open, 'multiSelections'],
      filters: [props.acceptable]
    })
    .then((files) => {
      emit('update:modelValue', uniqBy(fileList.value.concat(removeFileNameExt(files)), 'path'))
    })
}
function handleFileDrop(event) {
  isDragging.value = false

  if (props.rejectWhenGameRootNoSet && isEmpty(settings.value.gameRoot)) {
    ElMessage.warning('游戏根目录未设置, 操作拒绝')
    return
  }

  const dropInFiles = window.api.getDropFilesPath(event.dataTransfer.files)

  if (!props.folderMode) {
    const pngFiles = filter(dropInFiles, (f) => {
      return props.acceptable.extensions.some((ext) => f.path.endsWith(ext))
    })
    emit(
      'update:modelValue',
      uniqBy(cloneDeep(fileList.value.concat(removeFileNameExt(pngFiles))), 'path')
    )
  } else {
    window.electron.ipcRenderer.invoke('autoTaggingCards', cloneDeep(dropInFiles)).then((files) => {
      emit('update:modelValue', uniqBy(cloneDeep(fileList.value.concat(files)), 'path'))
    })
  }
}
function removeFileNameExt(files) {
  return files.map((f) => ({
    ...f,
    name: f.name.substring(0, f.name.lastIndexOf('.'))
  }))
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
