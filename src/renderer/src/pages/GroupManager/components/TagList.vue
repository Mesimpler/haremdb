<template>
  <div class="flex flex-wrap gap-2 items-center">
    <el-tag
      v-for="tag in tags"
      :key="tag.$loki"
      closable
      :disable-transitions="false"
      @close="handleRemove(tag)"
    >
      {{ tag.name }}
    </el-tag>
    <template v-if="inputVisible">
      <el-input
        ref="inputRef"
        v-model="inputValue"
        class="w-20"
        size="small"
        :spellcheck="false"
        @keyup.enter="handleInputConfirm"
        @blur="handleInputCancel"
      />
      <el-text type="info">按下 Enter 确认</el-text>
    </template>

    <el-button v-else class="button-new-tag" size="small" @click="showInput">+ New Tag</el-button>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue'
import { cloneDeep, findIndex } from 'lodash'
import { ElMessage } from 'element-plus'

const props = defineProps({
  row: Object
})

const tags = ref([])
onMounted(() => {
  fetchData()
})
function fetchData() {
  window.electron.ipcRenderer
    .invoke('db:get-tags-by-groupId', cloneDeep(props.row.$loki))
    .then((result) => {
      if (result.isSuccess) {
        tags.value = result.data
      } else {
        console.error(result.data)
        ElMessage.error(result.msg)
      }
    })
}

const inputVisible = ref(false)
const inputRef = ref(null)
const inputValue = ref('')
function showInput() {
  inputVisible.value = true
  nextTick(() => {
    inputRef.value.input.focus()
  })
}
function handleInputConfirm() {
  if (inputValue.value.trim() !== '') {
    const isRowRepeat = findIndex(tags.value, (tag) => tag.name === inputValue.value) !== -1
    if (isRowRepeat) {
      return ElMessage.warning('当前组内已包含该标签')
    } else {
      window.electron.ipcRenderer
        .invoke('db:add-tag-in-group', { name: inputValue.value, groupId: props.row.$loki })
        .then((result) => {
          if (result.isSuccess) {
            fetchData()
          } else {
            ElMessage.error(result.msg)
            console.error(result.data)
          }
        })
    }
  }
  inputVisible.value = false
  inputValue.value = ''
}
function handleInputCancel() {
  inputValue.value = ''
  inputVisible.value = false
}
function handleRemove(tag) {
  window.electron.ipcRenderer
    .invoke('db:remove-tag-in-group', { tagId: tag.$loki, groupId: props.row.$loki })
    .then((result) => {
      if (result.isSuccess) {
        fetchData()
      } else {
        ElMessage.error(result.msg)
        console.error(result.data)
      }
    })
}
</script>

<style scoped></style>
