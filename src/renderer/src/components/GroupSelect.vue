<template>
  <el-select
    v-model="model"
    placeholder="选择分组"
    filterable
    multiple
    value-key="$loki"
    v-bind="$attrs"
    default-first-option
    :multiple-limit="1"
    @focus="fetchData"
    @visible-change="(isShow) => isShow && fetchData()"
  >
    <el-option v-for="group in groups" :key="group.$loki" :label="group.name" :value="group" />
  </el-select>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { isEmpty } from 'lodash'
import { ref, watch } from 'vue'

const groups = ref([])
const model = defineModel({
  type: Array
})
const props = defineProps({
  optionsData: Array
})

watch(
  () => props.optionsData,
  (newData) => {
    groups.value = newData
  }
)

function fetchData() {
  if (isEmpty(props.optionsData)) {
    window.electron.ipcRenderer
      .invoke('db:get-groups', { currentPage: 1, pageSize: 9999, joinTag: false })
      .then((result) => {
        if (result.isSuccess) {
          groups.value = result.data.list
        } else {
          console.log(result.data)
          ElMessage.error(result.data.toString())
        }
      })
  }
}
</script>
