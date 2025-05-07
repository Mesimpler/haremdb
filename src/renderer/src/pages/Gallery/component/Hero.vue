<template>
  <el-dialog
    v-model="dialogVisible"
    title="图片信息"
    width="700"
    align-center
    append-to-body
    :close-on-click-modal="true"
  >
    <el-card shadow="never" class="w-100% mb-2" body-class="p-2 pr-3 flex gap-2 img-panel">
      <div class="w-140px min-h-180px h-auto flex flex-col">
        <el-image
          class="block border-el h-full"
          loading="lazy"
          cover
          :src="image && image.path && `local-resource://${image.path}`"
        />
        <el-text size="large" class="w-140px text-align-center" truncated></el-text>
      </div>
      <div class="w-full flex flex-col gap-2">
        <TagSelect v-model="image.tags" />
        <el-input
          v-model="image.remark"
          type="textarea"
          resize="none"
          input-style="height: 100%"
          placeholder="图片备注"
          class="h-full"
        />
        <div class="flex justify-between gap-4">
          <el-input v-model="image.name" placeholder="Please input">
            <template #prepend>文件名</template>
          </el-input>
          <div class="flex h-auto">
            <el-button type="danger" plain icon="Delete" @click="onDelete(image)"></el-button>
            <el-button type="success" plain icon="CircleCheck" @click="onSave"></el-button>
          </div>
        </div>
      </div>
    </el-card>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import TagSelect from '@components/TagSelect.vue'
import { ElMessage } from 'element-plus'
import { cloneDeep } from 'lodash'

const dialogVisible = ref(false)
const image = ref({})

function onDelete(image) {
  window.electron.ipcRenderer.invoke('db:delete-image', cloneDeep(image)).then((result) => {
    if (result.isSuccess) {
      dialogVisible.value = false
      ElMessage.success(result.msg)
      emit('deleted')
    } else {
      ElMessage.error(result.msg)
      console.error(result.data)
    }
  })
}
function onSave() {
  window.electron.ipcRenderer.invoke('db:update-image', cloneDeep(image.value)).then((result) => {
    if (result.isSuccess) {
      ElMessage.success(result.msg)
      emit('saved')
      dialogVisible.value = false
    } else {
      ElMessage.error(result.msg)
      console.error(result.data)
    }
  })
}

function show(imageId) {
  dialogVisible.value = true
  window.electron.ipcRenderer
    .invoke('db:get-image-byId', { imageId, joinTag: true })
    .then((result) => {
      if (result.isSuccess) {
        image.value = result.data
      } else {
        ElMessage.error(result.msg)
        console.error(result.data)
      }
    })
}

const emit = defineEmits(['saved', 'deleted'])
defineExpose({
  show
})
</script>

<style scoped></style>
