<template>
  <el-config-provider size="default">
    <el-container class="h-full">
      <el-header class="flex gap-2 items-center m-0 p-0 h-auto mb-2">
        <el-input
          v-model="searchName"
          class="w-200px"
          placeholder="搜索文件名"
          clearable
          :spellcheck="false"
        />
        <TagSelect
          v-model="searchTags"
          placeholder="搜索图片标签..."
          :allow-create="false"
          size="default"
          clearable
          class="flex-1"
        />

        <el-select
          v-model="sortOptions.selectProp"
          placeholder="选择排序方式"
          class="sort-select w-150px"
          value-key="prop"
        >
          <el-option
            v-for="item in sortOptions.props"
            :key="item.prop"
            :label="item.label"
            :value="item"
          />
          <template #prefix>
            <el-button
              :icon="sortOptions.selectOrder.icon"
              plain
              text
              class="p-0 px-2 h-23px"
              @click.stop="switchSortOrder"
            />
          </template>
        </el-select>
        <el-dropdown trigger="click">
          <el-button icon="MoreFilled" plain text />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>
                <el-checkbox
                  v-model="APP_SETTINGS.showImgName"
                  label="显示文件名"
                  :value="true"
                  @click.stop
                />
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-container class="!h-full gallery-container">
        <Aside :search-tags="searchTags" @toggle-tag="toggleTag" />
        <el-main class="p-0 pl-2 h-full">
          <div class="w-full flex flex-col">
            <div
              v-if="images && images.length > 0"
              v-loading="galleryLoading"
              element-loading-background="#ffffff00"
              class="w-full h-full flex-1 grid grid-cols-5 grid-rows-3 gap-2 items-start"
            >
              <div
                v-for="img in images"
                :key="img.$loki"
                class="hover-card relative w-full flex bg-blue border-el"
              >
                <el-image
                  class="block w-full min-h-180px cursor-pointer"
                  :src="`local-resource://${img.path}`"
                  loading="lazy"
                  @dragstart.prevent="onImgDragStart(img)"
                  @click="heroRef.show(img.$loki)"
                ></el-image>
                <div
                  v-show="APP_SETTINGS.showImgName"
                  class="absolute bottom-0 bg-dark-5/60 w-full flex justify-center px-2 py-0 mr-5px pointer-events-none"
                >
                  <el-text class="text-white" size="small" truncated>{{ img.name }}</el-text>
                </div>
                <div class="hover-card-detail"></div>
              </div>
            </div>
            <el-empty v-else class="flex-1"></el-empty>
            <el-pagination
              v-model:current-page="currentPage"
              :total="totalItems"
              :page-size="pageSize"
              background
              layout="prev, pager, next"
              class="mt-2 self-end"
            />
          </div>
        </el-main>
      </el-container>
    </el-container>

    <HeroDialog ref="heroRef" @deleted="fetchData" @updated="fetchData" />
  </el-config-provider>
</template>

<script setup>
import { computed, inject, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { findIndex, cloneDeep, debounce } from 'lodash'

import HeroDialog from './component/HeroDialog.vue'
import TagSelect from '@components/TagSelect.vue'
import Aside from './component/Aside.vue'

const APP_SETTINGS = inject('app-settings', {})

const images = ref()
const heroRef = ref(null)
const searchTags = ref([])
const searchName = ref('')
const totalItems = ref(0)
const pageSize = ref(15)
const currentPage = ref(1)
const galleryLoading = ref(false)
// 排序配置
const sortOptions = ref({
  selectOrder: { order: 'descending', icon: 'SortDown' },
  orders: [
    { order: 'descending', icon: 'SortDown' },
    { order: 'ascending', icon: 'SortUp' }
  ],
  selectProp: { label: '创建时间', prop: 'meta.created' },
  props: [
    { label: '创建时间', prop: 'meta.created' },
    { label: '文件名', prop: 'name' },
    { label: '拖拽次数', prop: 'useCount' }
  ]
})
// 计算当前排序方式
const sortBy = computed(() => ({
  prop: sortOptions.value.selectProp.prop,
  order: sortOptions.value.selectOrder.order
}))

function toggleTag(tag) {
  const index = findIndex(searchTags.value, { $loki: tag.$loki })
  if (index === -1) {
    searchTags.value.push(tag)
  } else {
    searchTags.value.splice(index, 1)
  }
}

onMounted(() => {
  const saved = localStorage.getItem('gallery-sort-options')
  if (saved) {
    sortOptions.value = { ...JSON.parse(saved) }
  }
})

watch(
  sortOptions,
  () => {
    localStorage.setItem('gallery-sort-options', JSON.stringify(sortOptions.value))
  },
  { deep: true }
)

/**
 * 获取图库数据
 * @param {Object} params - 查询参数
 * @param {number} params.currentPage - 当前页码
 * @param {number} params.pageSize - 每页大小
 * @param {Object} params.sortBy - 排序方式
 * @param {string} params.search - 搜索关键词
 */
function fetchData() {
  galleryLoading.value = true
  window.electron.ipcRenderer
    .invoke(
      'db:get-images',
      cloneDeep({
        currentPage: currentPage.value,
        pageSize: pageSize.value,
        sortBy: sortBy.value,
        searchName: searchName.value,
        searchTags: searchTags.value
      })
    )
    .then((result) => {
      if (result.isSuccess) {
        images.value = result.data.list
        totalItems.value = result.data.total
      } else {
        ElMessage.error(result.msg)
        console.error(result.data)
      }
    })
    .finally(() => {
      galleryLoading.value = false
    })
}
const debouncedFetchData = debounce(fetchData, 250)
/**
 * 切换排序顺序 (default -> descending -> ascending -> default...)
 */
function switchSortOrder() {
  const orders = sortOptions.value.orders
  const currentIndex = orders.findIndex((o) => o.order === sortOptions.value.selectOrder.order)
  const nextIndex = (currentIndex + 1) % orders.length
  sortOptions.value.selectOrder = orders[nextIndex]
}

// 监听页码,排序字段,文件名搜索变化
watch(
  [currentPage, sortBy, searchTags, searchName],
  () => {
    debouncedFetchData()
  },
  {
    immediate: true,
    deep: true
  }
)

const isInsideDrag = inject('isInsideDrag')
function onImgDragStart(img) {
  isInsideDrag.value = true
  window.electron.ipcRenderer.send('ondragstart', cloneDeep(img.path))
  window.electron.ipcRenderer.invoke('db:add-image-usecount', img.$loki).then((result) => {
    if (!result.isSuccess) {
      ElMessage.error(result.msg)
      console.error(result.data)
    } else {
      img.useCount = result.data
    }
  })
}
</script>

<style scoped>
/* 排序选择图标 */
.sort-select :deep(.el-select__wrapper) {
  padding: 3px 7px !important;
}

.hover-card:hover {
  /* transform: scale(1.03); */
  border-color: var(--el-color-primary);
}
</style>
