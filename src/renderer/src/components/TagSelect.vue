<template>
  <el-select
    v-model="model"
    multiple
    placeholder="选择或输入标签"
    filterable
    value-key="$loki"
    allow-create
    default-first-option
    tag-type="primary"
    @visible-change="onDropdown"
  >
    <el-option v-for="tag in tags" :key="tag.$loki" :label="tag.name" :value="tag">
      <div class="flex items-center justify-between h-full">
        <el-tag size="small">{{ tag.name }}</el-tag>
        <el-text v-if="tag && tag.groups" type="info" size="small">
          {{ getReadableGroups(tag.groups) }}
        </el-text>
      </div>
    </el-option>
  </el-select>
</template>

<script setup>
import { watch, ref } from 'vue'
import { ElMessage } from 'element-plus'

const tags = ref([])
const model = defineModel({
  type: Array
})

const isDropdownShow = ref(false)

watch(
  () => model.value,
  () => {
    if (!isDropdownShow.value) {
      tags.value = model.value
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
    .invoke('db:get-tags', { currentPage: 1, pageSize: 9999, joinGroup: true })
    .then((result) => {
      if (result.isSuccess) {
        tags.value = result.data.list
      } else {
        ElMessage.error(result.msg)
        console.error(result.data)
      }
    })
}

function getReadableGroups(groups) {
  const arr = groups.map((group) => group.name)
  return arr.join(', ')
}
</script>

<style scoped></style>
