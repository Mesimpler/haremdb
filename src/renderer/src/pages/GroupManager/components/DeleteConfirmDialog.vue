<template>
  <slot :show-dialog="() => (deleteConfirmDialogVisible = true)"></slot>

  <el-dialog
    v-model="deleteConfirmDialogVisible"
    title="提示"
    width="400"
    destroy-on-close
    append-to-body
  >
    <div class="flex items-center gap-2 p-2">
      <el-icon color="#E6A23C" size="24"><WarningFilled /></el-icon>
      <span>是否确认删除该分组?</span>
    </div>
    <template #footer>
      <div class="flex items-center justify-between">
        <el-tooltip
          content="勾选此项会将该分组属下的所有标签删除,这些标签可能属于其它分组 "
          placement="bottom"
        >
          <el-checkbox v-model="isCascadeDeleteTags" class="pb-1">同时删除属下标签</el-checkbox>
        </el-tooltip>
        <div class="flex items-center">
          <el-button @click="deleteConfirmDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="onConfirm">确认</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { cloneDeep } from 'lodash'

const props = defineProps({
  row: Object
})

const deleteConfirmDialogVisible = ref(false)
const isCascadeDeleteTags = ref(false)

const emit = defineEmits(['deleted'])

function onConfirm() {
  window.electron.ipcRenderer
    .invoke(
      'db:delete-group',
      cloneDeep({ groupId: props.row.$loki, isCascadeDeleteTags: isCascadeDeleteTags.value })
    )
    .then((result) => {
      if (result.isSuccess) {
        ElMessage.success(result.msg)
      } else {
        ElMessage.error(result.msg)
        console.error(result.data)
      }
    })
    .finally(() => {
      emit('deleted')
      deleteConfirmDialogVisible.value = false
    })
}
</script>

<style scoped></style>
