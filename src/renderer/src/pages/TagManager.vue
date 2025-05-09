<template>
  <el-table
    :data="tableData"
    sortable="custom"
    border
    style="width: 100%"
    :default-sort="DEFAULT_SORT"
    @sort-change="onSortChange"
  >
    <el-table-column label="标签名称" prop="name">
      <template #default="{ row }">
        <el-tag v-if="editingRow !== row" disable-transitions>{{ row.name }}</el-tag>
        <el-input
          v-else
          ref="inputRef"
          v-model="row.name"
          placeholder="输入标签名称"
          :spellcheck="false"
          @keyup.enter="onSaveEdit(row)"
          @blur="onSaveEdit(row)"
        >
          <template #suffix>
            <el-text type="info">按下Enter确认</el-text>
          </template>
        </el-input>
      </template>
    </el-table-column>
    <el-table-column label="分组" prop="group" width="220">
      <template #default="{ row }">
        <GroupSelect
          v-model="row.groups"
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="2"
          @change="handleGroupChange(row)"
        />
      </template>
    </el-table-column>
    <el-table-column label="创建时间" prop="meta.created" sortable width="130">
      <template #default="{ row }">
        {{ dayjs(row.meta.created).format('YYYY/MM/DD HH:mm') }}
      </template>
    </el-table-column>
    <el-table-column align="right" width="250px">
      <template #header>
        <div class="flex gap-3">
          <el-input
            v-model="search"
            size="small"
            placeholder="搜索标签名称"
            clearable
            prefix-icon="Search"
            :spellcheck="false"
            @input="debouncedFetchData"
          />
          <el-button size="small" type="primary" @click="dialogFormVisible = true">
            添加标签
          </el-button>
        </div>
      </template>
      <template #default="{ row }">
        <el-button size="small" @click="onClickRename(row)">重命名</el-button>
        <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <div class="flex justify-end mt-2">
    <el-pagination
      v-model:current-page="currentPage"
      :total="totalItems"
      :page-size="pageSize"
      background
      size="default"
      layout="prev, pager, next"
    />
  </div>

  <el-dialog v-model="dialogFormVisible" :close-on-click-modal="false" title="添加标签" width="500">
    <el-form ref="formRef" :model="form" label-width="70px">
      <el-form-item label="标签名称" required prop="name">
        <el-input v-model="form.name" autocomplete="off" :spellcheck="false" />
      </el-form-item>
      <el-form-item label="标签分组" prop="groups">
        <GroupSelect v-model="form.groups" />
      </el-form-item>
      <el-form-item class="mb-0">
        <div class="flex w-full justify-end">
          <el-button type="primary" @click="onSubmit">确认</el-button>
          <el-button @click="dialogFormVisible = false">取消</el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { watch, ref, nextTick } from 'vue'
import { cloneDeep, debounce } from 'lodash'
import { ElMessage } from 'element-plus'
import GroupSelect from '@components/GroupSelect.vue'
import dayjs from 'dayjs'

const tableData = ref([])
const tableLoading = ref(false)
const totalItems = ref(0)
const search = ref('')
const DEFAULT_SORT = { prop: 'meta.created', order: 'descending' }
const sortBy = ref(DEFAULT_SORT)
const pageSize = ref(10)
const currentPage = ref(1)

function fetchData() {
  tableLoading.value = true
  window.electron.ipcRenderer
    .invoke(
      'db:get-tags',
      cloneDeep({
        currentPage: currentPage.value,
        pageSize: pageSize.value,
        sortBy: sortBy.value,
        search: search.value,
        joinGroup: true
      })
    )
    .then((result) => {
      if (result.isSuccess) {
        tableData.value = result.data.list
        totalItems.value = result.data.total
      } else {
        ElMessage.error(result.msg)
        console.error(result.data)
      }
    })
    .finally(() => {
      tableLoading.value = false
    })
}
const debouncedFetchData = debounce(fetchData, 250)

function onSortChange(event) {
  // event.column 中可能包含无法克隆对象
  delete event.column
  sortBy.value = event
}

watch(
  [currentPage, search],
  () => {
    debouncedFetchData()
  },
  { immediate: true }
)

const editingRow = ref(null)
const inputRef = ref(null)
const originalName = ref('')
function onClickRename(row) {
  editingRow.value = row
  originalName.value = row.name
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function onSaveEdit(row) {
  // 未更改
  if (editingRow.value?.name === originalName.value) {
    editingRow.value = null
    return
  }

  // 空值
  if (!editingRow.value?.name?.trim()) {
    editingRow.value.name = originalName.value
    editingRow.value = null
    ElMessage.warning('分组名称不能为空')
    return
  }

  editingRow.value = null
  window.electron.ipcRenderer
    .invoke('db:update-tag', cloneDeep(row))
    .then((result) => {
      if (result.isSuccess) {
        ElMessage.success(result.msg)
      } else {
        ElMessage.error(result.msg)
        console.error(result.data)
      }
    })
    .finally(() => {
      fetchData({
        currentPage: currentPage.value,
        pageSize: pageSize.value,
        sortBy: sortBy.value,
        search: search.value
      })
    })
}

function remove(row) {
  window.electron.ipcRenderer
    .invoke('db:delete-tag', row.$loki)
    .then((result) => {
      if (result.isSuccess) {
        ElMessage.success(result.msg)
      } else {
        ElMessage.error(result.msg)
        console.error(result.data)
      }
    })
    .finally(() => {
      fetchData({
        currentPage: currentPage.value,
        pageSize: pageSize.value,
        sortBy: sortBy.value,
        search: search.value
      })
    })
}

function handleGroupChange(row) {
  window.electron.ipcRenderer
    .invoke('db:update-tag', cloneDeep(row))
    .then((result) => {
      if (result.isSuccess) {
        ElMessage.success(result.msg)
      } else {
        ElMessage.error(result.msg)
        console.log(result.data)
      }
    })
    .finally(() => {
      fetchData()
    })
}

const dialogFormVisible = ref(false)
const form = ref({})
const formRef = ref(null)
watch(dialogFormVisible, (newDialogFormVisible) => {
  if (!newDialogFormVisible && formRef.value) formRef.value.resetFields()
})
function onSubmit() {
  window.electron.ipcRenderer
    .invoke('db:add-tag', cloneDeep(form.value))
    .then((result) => {
      if (result.isSuccess) {
        ElMessage.success(result.msg)
      } else {
        ElMessage.error(result.msg)
        console.error(result.data)
      }
    })
    .finally(() => {
      fetchData()
      dialogFormVisible.value = false
    })
}
</script>

<style scoped></style>
