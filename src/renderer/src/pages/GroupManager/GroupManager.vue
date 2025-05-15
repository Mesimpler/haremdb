<template>
  <el-table
    :data="tableData"
    sortable="custom"
    border
    style="width: 100%"
    :default-sort="DEFAULT_SORT"
    @sort-change="onSortChange"
  >
    <el-table-column type="expand">
      <template #default="{ row }">
        <div class="px-12">
          <TagList :row="row" />
        </div>
      </template>
    </el-table-column>
    <el-table-column label="分组名称" prop="name">
      <template #default="{ row }">
        <el-text v-if="editingRow !== row">{{ row.name }}</el-text>
        <el-input
          v-else
          ref="inputRef"
          v-model="row.name"
          placeholder="输入分组名称"
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
    <el-table-column label="创建时间" prop="meta.created" sortable>
      <template #default="{ row }">
        {{ dayjs(row.meta.created).format('YYYY/MM/DD HH:mm') }}
      </template>
    </el-table-column>
    <el-table-column label="排序" prop="index" sortable width="80px" />
    <el-table-column align="right" width="250px">
      <template #header>
        <div class="flex gap-3">
          <el-input
            v-model="search"
            size="small"
            placeholder="搜索分组名称"
            clearable
            prefix-icon="Search"
            :spellcheck="false"
            @input="debouncedFetchData"
          />
          <el-button size="small" type="primary" @click="addFrmDialogVisible = true">
            添加分组
          </el-button>
        </div>
      </template>
      <template #default="{ row }">
        <el-button size="small" @click="onClickRename(row)">重命名</el-button>
        <DeleteConfirmDialog
          v-slot="{ showDialog }"
          :row="row"
          @deleted="fetchData({ currentPage, pageSize, sortBy, search })"
        >
          <el-button size="small" type="danger" @click="showDialog">删除</el-button>
        </DeleteConfirmDialog>
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

  <el-dialog v-model="addFrmDialogVisible" title="添加分组" width="500">
    <el-form ref="formRef" :model="form" label-width="70px">
      <el-form-item label="分组名称" required prop="name">
        <el-input v-model="form.name" autocomplete="off" :spellcheck="false" />
      </el-form-item>
      <el-form-item class="mb-0">
        <div class="flex w-full justify-end">
          <el-button type="primary" @click="onSubmit">确认</el-button>
          <el-button @click="addFrmDialogVisible = false">取消</el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { watch, ref, nextTick } from 'vue'
import { cloneDeep, debounce } from 'lodash'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import DeleteConfirmDialog from './components/DeleteConfirmDialog.vue'
import TagList from './components/TagList.vue'

// 表格行为
const tableData = ref([])
const tableLoading = ref(false)
const totalItems = ref(0)
const search = ref('')
const DEFAULT_SORT = { prop: 'index', order: 'ascending' }
const sortBy = ref(DEFAULT_SORT)
const pageSize = ref(10)
const currentPage = ref(1)

function fetchData() {
  tableLoading.value = true
  window.electron.ipcRenderer
    .invoke(
      'db:get-groups',
      cloneDeep({
        currentPage: currentPage.value,
        pageSize: pageSize.value,
        sortBy: sortBy.value,
        search: search.value,
        joinTag: false
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
  [currentPage, sortBy, search],
  () => {
    debouncedFetchData()
  },
  { immediate: true }
)

// 重命名分组
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
    .invoke('db:update-group', cloneDeep(row))
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

// 添加分组
const addFrmDialogVisible = ref(false)
const form = ref({})
const formRef = ref(null)
watch(addFrmDialogVisible, (newDialogFormVisible) => {
  if (!newDialogFormVisible && formRef.value) formRef.value.resetFields()
})
function onSubmit() {
  window.electron.ipcRenderer
    .invoke('db:add-group', cloneDeep(form.value))
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
      addFrmDialogVisible.value = false
    })
}
</script>

<style scoped></style>
