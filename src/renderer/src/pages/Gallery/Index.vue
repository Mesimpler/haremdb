<template>
  <el-config-provider size="default">
    <el-container>
      <el-header class="flex gap-2 items-center m-0 p-0 h-auto mb-2">
        <el-input v-model="searchName" class="w-200px" placeholder="搜索文件名" clearable />
        <el-input-tag
          v-model="searchTags"
          placeholder="搜索图片标签..."
          size="default"
          clearable
          class="flex-1"
          tag-type="primary"
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
                <el-checkbox v-model="showImgName" label="显示文件名" :value="true" @click.stop />
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-container>
        <Aside :search-tags="searchTags" @toggle-tag="toggleTag" />
        <el-main class="p-0 pl-2">
          <div class="h-full w-full flex flex-col">
            <div
              v-loading="galleryLoading"
              class="w-full flex-1 grid grid-cols-5 grid-rows-3 gap-2 items-start"
            >
              <div
                v-for="img in images"
                :key="img.$loki"
                class="relative w-full flex bg-blue border-el"
              >
                <el-image
                  class="block w-full min-h-180px cursor-pointer"
                  :src="`local-resource://${img.path}`"
                  loading="lazy"
                  @dragstart.prevent="onImgDrag(img)"
                  @click="heroRef.show(img.$loki)"
                ></el-image>
                <div
                  v-if="showImgName"
                  class="absolute bottom-0 bg-dark-5/60 w-full flex justify-center px-2 py-0 mr-5px pointer-events-none"
                >
                  <el-text class="text-white" size="small" truncated>{{ img.name }}</el-text>
                </div>
              </div>
            </div>
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

    <Hero ref="heroRef" @deleted="loadGalleryData" @saved="loadGalleryData" />
  </el-config-provider>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { cloneDeep, debounce } from 'lodash'
import Hero from './component/Hero.vue'
import Aside from './component/Aside.vue'

const images = ref()
const showImgName = ref(true)
const heroRef = ref(null)
const searchTags = ref([])
const searchName = ref('')
const totalItems = ref(0)
const pageSize = ref(15)
const currentPage = ref(1)
const galleryLoading = ref(false)
// 排序配置
const sortOptions = ref({
  selectOrder: { order: 'desc', icon: 'SortDown' },
  orders: [
    { order: 'desc', icon: 'SortDown' },
    { order: 'asc', icon: 'SortUp' }
  ],
  selectProp: { label: '创建时间', prop: 'meta.created' },
  props: [
    { label: '创建时间', prop: 'meta.created' },
    { label: '文件名', prop: 'name' },
    { label: '拖拽次数', prop: 'count' }
  ]
})
// 计算当前排序方式
const sortBy = computed(() => ({
  prop: sortOptions.value.selectProp.prop,
  order: sortOptions.value.selectOrder.order
}))

function toggleTag(tagName) {
  const index = searchTags.value.indexOf(tagName)
  if (index === -1) {
    searchTags.value.push(tagName)
  } else {
    searchTags.value.splice(index, 1)
  }
}
/**
 * 获取图库数据
 * @param {Object} params - 查询参数
 * @param {number} params.currentPage - 当前页码
 * @param {number} params.pageSize - 每页大小
 * @param {Object} params.sortBy - 排序方式
 * @param {string} params.search - 搜索关键词
 */
function fetchGalleryData(queryOptions) {
  galleryLoading.value = true
  window.electron.ipcRenderer
    .invoke('db:get-images', cloneDeep(queryOptions))
    .then((result) => {
      if (result.isSuccess) {
        images.value = result.data.list
        totalItems.value = result.data.total
      } else {
        console.error('获取图片数据失败:', result.data)
        ElMessage.error('加载图片数据失败')
      }
    })
    .finally(() => {
      galleryLoading.value = false
    })
}
/**
 * 切换排序顺序 (default -> desc -> asc -> default...)
 */
function switchSortOrder() {
  const orders = sortOptions.value.orders
  const currentIndex = orders.findIndex((o) => o.order === sortOptions.value.selectOrder.order)
  const nextIndex = (currentIndex + 1) % orders.length
  //  直接赋值 selectOrder 会导致无法触发 computed
  sortOptions.value.selectOrder.icon = orders[nextIndex].icon
  sortOptions.value.selectOrder.order = orders[nextIndex].order
}
/**
 * 加载图库数据（封装watch中的重复逻辑）
 */
function loadGalleryData() {
  fetchGalleryData(
    cloneDeep({
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      searchName: searchName.value,
      searchTags: searchTags.value
    })
  )
}
const debouncedSearch = debounce(loadGalleryData, 250)

// 监听页码,排序字段,文件名搜索变化
watch(
  [
    currentPage,
    () => sortOptions.value.selectProp,
    sortOptions.value.selectOrder,
    searchTags,
    searchName
  ],
  () => {
    debouncedSearch()
  },
  {
    immediate: true,
    deep: true
  }
)

function onImgDrag(img) {
  window.electron.ipcRenderer.send('ondragstart', cloneDeep(img.path))
}
</script>

<style scoped>
/* 排序选择图标 */
.sort-select :deep(.el-select__wrapper) {
  padding: 3px 7px !important;
}
</style>
