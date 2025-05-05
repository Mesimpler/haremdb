<template>
  <el-select
    multiple
    placeholder="选择或输入标签"
    filterable
    value-key="$loki"
    allow-create
    default-first-option
    tag-type="primary"
  >
    <el-option v-for="tag in tags" :key="tag.$loki" :label="tag.name" :value="tag">
      <div class="flex items-center justify-between pr-2">
        <el-tag size="small">{{ tag.name }}</el-tag>
        <span class="text-#909399 font-13px">
          {{ getReadableGroups(tag.groups) }}
        </span>
      </div>
    </el-option>
  </el-select>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

const tags = ref([])

function fetchData() {
  window.electron.ipcRenderer
    .invoke('db:get-tags', { currentPage: 1, pageSize: 9999, joinGroup: true })
    .then((result) => {
      if (result.isSuccess) {
        tags.value = result.data.list
      } else {
        console.log(result.data)
        ElMessage.error(result.data.toString())
      }
    })
}

function getReadableGroups(groups) {
  const arr = groups.map((group) => group.name)
  return arr.join()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped></style>
