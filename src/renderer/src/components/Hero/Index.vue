<template>
  <el-card shadow="never" class="w-100% mb-2 img-panel" body-class="p-2 pr-3 flex gap-2">
    <div class="w-140px min-h-190px h-auto flex flex-col">
      <el-image
        class="block border-el h-full"
        loading="lazy"
        cover
        :src="`local-resource://${file.path}`"
      />
      <el-text size="large" class="w-140px text-align-center" truncated></el-text>
    </div>
    <div class="w-full flex flex-col gap-2 flex-1">
      <!-- 第一行 -->
      <TagSelect v-model="file.tags" />

      <!-- 第二行 -->
      <div class="w-full flex gap-2 flex-1">
        <el-input
          v-model="file.remark"
          type="textarea"
          resize="none"
          input-style="height: 100%"
          placeholder="图片备注"
          class="h-full"
        />
        <Uploader
          v-model="file.mods"
          :acceptable="{ name: 'zipmod', extensions: ['zipmod'] }"
          :prevent-open-dialog="true"
          @click.stop="file.showDrawer = true"
        >
          <el-text size="default">
            <el-tooltip class="box-item" effect="dark" placement="top">
              <template #content>
                <span>系统会将这些文件添加到游戏根目录的mods/haremdb</span>
              </template>
              <el-icon color="#909399"><WarningFilled /></el-icon>
            </el-tooltip>
            拖拽 .zipmod 到此
          </el-text>
          <el-text v-if="file.mods && file.mods.length > 0" size="small" type="info">
            关联了 {{ file.mods.length }} 个文件, 共 {{ filesize(totalModFileSize(file.mods)) }}
          </el-text>
          <el-text v-else size="small" type="info">暂未关联文件</el-text>
          <el-drawer
            v-model="file.showDrawer"
            append-to-body
            title="zipmod 文件列表"
            direction="rtl"
            :show-close="false"
            size="45%"
          >
            <div class="relative h-full flex flex-col">
              <Uploader
                v-model="file.mods"
                :acceptable="{ name: 'zipmod', extensions: ['zipmod'] }"
              >
                <el-text size="large">拖拽 .zipmod 到此或点击选择</el-text>
              </Uploader>

              <ModList v-model="file.mods" @closed-file="onRemoveMod" />

              <el-text
                v-if="file.mods && file.mods.length > 0"
                size="small"
                type="info"
                class="self-start"
              >
                关联了 {{ file.mods.length }} 个文件, 共 {{ filesize(totalModFileSize(file.mods)) }}
              </el-text>
              <el-text v-else size="small" type="info">暂未关联文件</el-text>
              <el-text size="small" type="warning" class="absolute bottom-5">
                <el-icon><WarningFilled /></el-icon>
                当你移除文件时系统不会删除关联的.zipmod文件
              </el-text>
              <el-text size="small" type="warning" class="absolute bottom-0">
                如果有需要请自行前往删除
              </el-text>
            </div>
          </el-drawer>
        </Uploader>
      </div>

      <!-- 第三行 -->
      <div class="w-full flex gap-2">
        <el-input v-model="file.name" placeholder="Please input" class="flex-1">
          <template #prepend>文件名</template>
          <template #suffix>
            <el-text type="info">{{ filesize(file.size) }}</el-text>
          </template>
        </el-input>
        <div class="flex h-auto">
          <el-button type="danger" plain icon="Delete" @click="onRemove(file)"></el-button>
          <el-button type="success" plain icon="CircleCheck" @click="onSave(file)"></el-button>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { inject, ref, watchEffect } from 'vue'
import { isEmpty, cloneDeep, filter } from 'lodash'
import TagSelect from '@components/TagSelect.vue'
import { ElMessage } from 'element-plus'
import { filesize } from 'filesize'
import Uploader from '@components/Uploader.vue'
import ModList from './components/ModList.vue'

const props = defineProps({
  data: Object
})

const settings = inject('app-settings', {})

const file = ref({})
const emit = defineEmits(['removeCard'])

watchEffect(() => {
  file.value = props.data
  if (file.value.mods === undefined) {
    file.value.mods = []
  }
})

function totalModFileSize(modFiles) {
  if (!isEmpty(modFiles)) {
    return modFiles.reduce((acc, cur) => acc + cur.size, 0)
  } else {
    return 0
  }
}

function onRemoveMod(mod) {
  file.value.mods = filter(file.value.mods, (m) => m.path !== mod.path)
}

function onRemove(file) {
  emit('removeCard', file)
}
function onSave(file) {
  window.electron.ipcRenderer
    .invoke('db:add-image', cloneDeep(file), cloneDeep(settings.value))
    .then((result) => {
      if (result.isSuccess) {
        onRemove(file)
        ElMessage.success(result.msg)
      } else {
        console.error(result.data)
        ElMessage.error(result.msg)
      }
    })
}
</script>

<style scoped>
.dropzone {
  width: 100%;
  border: 2px dashed var(--el-border-color);
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px 8px 20px 8px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: var(--el-fill-color-extra-light);
}

.dropzone:hover,
.dropzone.dragover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.dropzone p {
  margin-bottom: 10px;
}

.zipmod-upload :deep(.el-upload--text) {
  display: none;
}

.zipmod-upload :deep(.el-upload-list__item:hover) {
  background-color: var(--el-color-info-light-2);
}
</style>
