<template>
  <el-select
    v-model="model"
    placeholder="选择分组"
    filterable
    multiple
    value-key="$loki"
    v-bind="$attrs"
    default-first-option
    @visible-change="onDropdown"
  >
    <el-option v-for="group in groups" :key="group.$loki" :label="group.name" :value="group" />
  </el-select>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { ref, watch } from 'vue'

const groups = ref([])
const model = defineModel({
  type: Array
})
const isDropdownShow = ref(false)

watch(
  () => model.value,
  () => {
    if (!isDropdownShow.value) {
      groups.value = model.value
    }
  },
  { immediate: true }
)

function onDropdown(isShow) {
  isDropdownShow.value = isShow
  if (isShow) fetchData()
}

function fetchData() {
  window.electron.ipcRenderer
    .invoke('db:get-groups', { currentPage: 1, pageSize: 9999, joinTag: false })
    .then((result) => {
      if (result.isSuccess) {
        groups.value = result.data.list
      } else {
        ElMessage.error(result.msg)
        console.error(result.data)
      }
    })
}
</script>
