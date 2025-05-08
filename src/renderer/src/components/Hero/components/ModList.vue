<template>
  <TransitionGroup name="list" tag="ul" class="w-full p-2 pr-0">
    <li
      v-for="file in fileList"
      :key="file.path"
      class="w-full flex justify-between p-1 pl-0 cursor-pointer hover-effect"
    >
      <el-text class="item-name-hover">
        <el-icon class="mr-2"><Document /></el-icon>
        <span class="item-name">{{ file.name }}</span>
      </el-text>

      <div class="flex gap-2">
        <el-text type="success" class="success-icon">
          <el-icon><CircleCheck /></el-icon>
        </el-text>
        <el-text class="folder-icon" @click="openFolder(file.path)">
          <el-icon><Folder /></el-icon>
        </el-text>
        <el-text class="close-icon" @click="emit('closed-file', file)">
          <el-icon><Close /></el-icon>
        </el-text>
      </div>
    </li>
  </TransitionGroup>
</template>

<script setup>
import { ElMessage } from 'element-plus'

const emit = defineEmits(['closed-file'])
const fileList = defineModel({
  type: Array
})
function openFolder(filePath) {
  window.electron.ipcRenderer.invoke('showFileInExploer', filePath).then((result) => {
    if (!result)
      ElMessage({
        type: 'error',
        dangerouslyUseHTMLString: true,
        message: '<strong>文件不存在: </strong><br/>' + filePath
      })
  })
}
</script>

<style scoped>
.close-icon,
.folder-icon {
  display: none;
}
.close-icon:hover,
.folder-icon:hover {
  color: var(--el-color-primary);
}
.hover-effect:hover .success-icon {
  display: none;
}
.hover-effect:hover .close-icon {
  display: block;
}
.hover-effect:hover .folder-icon {
  display: block;
}
.item-name-hover:hover .item-name {
  color: var(--el-color-primary);
}
/* 过渡 */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.list-leave-active {
  position: absolute;
}
</style>
