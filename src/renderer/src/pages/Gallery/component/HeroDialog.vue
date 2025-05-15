<template>
  <el-dialog
    v-model="dialogVisible"
    title="图片信息"
    width="700"
    align-center
    append-to-body
    :close-on-click-modal="false"
    class="overflow-hidden"
  >
    <!-- 使用 v-if 避免发生空值错误 -->
    <Hero
      v-if="!isEmpty(image)"
      :data="image"
      :show-more-remark="true"
      @delete="onDelete"
      @confirm="onUpdate"
    />
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { cloneDeep, isEmpty } from 'lodash'

import Hero from '@components/Hero/Index.vue'

const dialogVisible = ref(false)
const image = ref({})

function onDelete(file) {
  window.electron.ipcRenderer.invoke('db:delete-image', cloneDeep(file)).then((result) => {
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

function onUpdate(file) {
  window.electron.ipcRenderer.invoke('db:update-image', cloneDeep(file)).then((result) => {
    if (result.isSuccess) {
      dialogVisible.value = false
      ElMessage.success(result.msg)
      emit('updated')
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

const emit = defineEmits(['updated', 'deleted'])
defineExpose({
  show
})
</script>

<style scoped></style>
