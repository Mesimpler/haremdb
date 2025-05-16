<template>
  <el-aside class="h-full" width="320px">
    <el-scrollbar class="border-el h-600px" always>
      <div v-if="isEmpty(groupTags) && isEmpty(unGroupTags)" class="p-12 text-align-center">
        <el-text type="info">暂无分组数据</el-text>
      </div>

      <!-- 未分组置顶 -->
      <el-collapse v-if="!isEmpty(unGroupTags)" class="border-t-0">
        <el-collapse-item>
          <template #title>
            <div class="flex justify-between items-center w-full mx-4">
              <el-text>未分组</el-text>
            </div>
          </template>
          <div class="flex gap-2 flex-wrap px-2">
            <el-tag
              v-for="tag in unGroupTags"
              :key="tag.$loki"
              :type="searchTags && searchTags.includes(tag.name) ? 'primary' : 'info'"
              class="cursor-pointer"
              @click="toggleTag(tag)"
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </el-collapse-item>
      </el-collapse>

      <el-collapse v-if="!isEmpty(groupTags)" class="w-full h-auto border-t-0">
        <VueDraggable
          v-model="groupTags"
          :animation="150"
          target=".sort-target"
          @start="draging = true"
          @sort="onSort"
        >
          <TransitionGroup
            type="transition"
            :name="!draging ? 'fade' : undefined"
            tag="div"
            class="sort-target"
          >
            <el-collapse-item v-for="group in groupTags" :key="group.$loki" :title="group.name">
              <template #title>
                <div class="flex justify-between items-center w-full mx-4">
                  <el-text>{{ group.name }}</el-text>
                </div>
              </template>
              <div class="flex gap-2 flex-wrap px-2">
                <el-tag
                  v-for="tag in group.tags"
                  :key="tag.$loki"
                  :type="isSearchTag(tag) ? 'primary' : 'info'"
                  class="cursor-pointer"
                  @click="toggleTag(tag)"
                >
                  {{ tag.name }}
                </el-tag>
              </div>
            </el-collapse-item>
          </TransitionGroup>
        </VueDraggable>
      </el-collapse>
    </el-scrollbar>
  </el-aside>
</template>

<script setup>
import { ref, onMounted, nextTick, inject, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { cloneDeep, isEmpty, findIndex } from 'lodash'
import { VueDraggable } from 'vue-draggable-plus'

const props = defineProps({
  searchTags: Array
})

// 初始化数据加载
onMounted(() => {
  fetchGroupTagsData()
  fetchUnGroupTagsData()
})

const groupTags = ref([])
const unGroupTags = ref([])
const draging = ref(false)

const isInsideDrag = inject('isInsideDrag')
watch(draging, () => {
  isInsideDrag.value = draging
})

/**
 * 获取分组标签数据
 */
function fetchGroupTagsData() {
  window.electron.ipcRenderer
    .invoke('db:get-groups', {
      currentPage: 1,
      pageSize: 9999,
      sortBy: { prop: 'index', order: 'ascending' },
      joinTag: true
    })
    .then((result) => {
      if (result.isSuccess) {
        groupTags.value = result.data.list
      } else {
        ElMessage.error(result.msg)
        console.error(result.data)
      }
    })
}
function fetchUnGroupTagsData() {
  window.electron.ipcRenderer.invoke('db:get-unc-tags').then((result) => {
    if (result.isSuccess) {
      unGroupTags.value = result.data
    } else {
      ElMessage.error('加载数据失败')
    }
  })
}

function toggleTag(tag) {
  emit('toggleTag', tag)
}
function onSort() {
  groupTags.value.forEach((group, index) => {
    group.index = index
  })
  window.electron.ipcRenderer
    .invoke('db:update-groups-index', cloneDeep(groupTags.value))
    .then((result) => {
      if (!result.isSuccess) {
        ElMessage.error(result.msg)
        console.error(result.data)
      }
    })
  nextTick(() => {
    draging.value = false
  })
}

function isSearchTag(tag) {
  if (props.searchTags) {
    const isInclude = findIndex(props.searchTags, { $loki: tag.$loki })
    if (isInclude !== -1) return true
  }

  return false
}

const emit = defineEmits(['toggleTag'])
</script>

<style scoped>
/* 分组列表宽度 */
.el-collapse {
  --el-collapse-header-height: 38px;
}

/* drag */
.fade-move,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scaleY(0.01) translate(30px, 0);
}

.fade-leave-active {
  position: absolute;
}

.sortable-drag {
  opacity: 1;
  border: 1px dashed #409eff;
  transform: scale(0.95);
}
</style>
